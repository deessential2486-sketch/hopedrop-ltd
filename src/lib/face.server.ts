import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Liveness / face-capture verification.
// - Frames are analysed by a vision model to confirm a real, live human face.
// - Only the best frame is stored, in a private bucket, under the user's own folder.

export type FaceVerifyResult =
  | { status: "verified" }
  | { error: string; retryable?: boolean };

const MAX_ATTEMPTS_PER_HOUR = 8;

const PROMPT = `You are a KYC liveness reviewer for a Nigerian fintech app.
You are given 3 selfie frames captured in sequence from a live camera. The user was asked to:
1) look straight at the camera, 2) blink or close their eyes, 3) turn their head slightly to one side.

Decide whether this is a genuine live person performing those actions.
Reject if: no face is visible, more than one face, the image is a photo of a printed picture or of a phone/computer screen, the face is heavily obscured (mask, hand, sunglasses covering eyes), the frames are identical with no change, or the image quality is too poor to judge.

Reply with ONLY compact JSON, no markdown:
{"live": true|false, "confidence": 0-1, "reason": "<max 15 words, user friendly>"}`;

async function analyseFrames(frames: string[]): Promise<{
  live: boolean;
  confidence: number;
  reason: string;
} | null> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return null;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3.7-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            ...frames.map((f) => ({ type: "image_url", image_url: { url: f } })),
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error("busy");
    if (res.status === 402) throw new Error("credits");
    throw new Error("gateway");
  }

  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = body.choices?.[0]?.message?.content ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as {
      live?: boolean;
      confidence?: number;
      reason?: string;
    };
    return {
      live: parsed.live === true,
      confidence: Number(parsed.confidence ?? 0),
      reason: typeof parsed.reason === "string" ? parsed.reason : "",
    };
  } catch {
    return null;
  }
}

export async function verifyFace(
  userId: string,
  frames: string[],
): Promise<FaceVerifyResult> {
  if (!Array.isArray(frames) || frames.length < 2) {
    return { error: "The face scan did not complete. Please try again." };
  }
  for (const f of frames) {
    if (!/^data:image\/(jpeg|png|webp);base64,/.test(f) || f.length > 3_000_000) {
      return { error: "The captured image is invalid or too large. Please try again." };
    }
  }

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("kyc_verification_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", "face")
    .gte("created_at", since);

  if ((count ?? 0) >= MAX_ATTEMPTS_PER_HOUR) {
    return { error: "Too many face scan attempts. Please try again in an hour." };
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("face_verification_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile) return { error: "Profile not found." };
  if ((profile as { face_verification_status?: string }).face_verification_status === "verified") {
    return { status: "verified" };
  }

  await supabaseAdmin
    .from("profiles")
    .update({ face_verification_status: "pending" } as never)
    .eq("user_id", userId);

  let verdict: Awaited<ReturnType<typeof analyseFrames>>;
  try {
    verdict = await analyseFrames(frames.slice(0, 3));
  } catch (e) {
    await supabaseAdmin
      .from("profiles")
      .update({ face_verification_status: "not_verified" } as never)
      .eq("user_id", userId);
    const kind = (e as Error).message;
    return {
      error:
        kind === "busy"
          ? "Our verification service is busy. Please try again in a moment."
          : kind === "credits"
            ? "Face verification is temporarily unavailable. Please contact support."
            : "We could not reach the verification service. Please retry.",
      retryable: kind !== "credits",
    };
  }

  if (!verdict) {
    await supabaseAdmin
      .from("profiles")
      .update({ face_verification_status: "not_verified" } as never)
      .eq("user_id", userId);
    return {
      error: "Face verification is not configured yet. Please contact support.",
    };
  }

  const passed = verdict.live && verdict.confidence >= 0.6;

  await supabaseAdmin.from("kyc_verification_attempts").insert({
    user_id: userId,
    kind: "face",
    provider: "liveness-ai",
    succeeded: passed,
    reference: null,
  } as never);

  if (!passed) {
    await supabaseAdmin
      .from("profiles")
      .update({ face_verification_status: "failed" } as never)
      .eq("user_id", userId);
    return {
      error: verdict.reason
        ? `Face check failed: ${verdict.reason}. Please retry in good lighting.`
        : "We could not confirm a live face. Please retry in good lighting.",
      retryable: true,
    };
  }

  // Store the first (straight-on) frame for the compliance record.
  const best = frames[0]!;
  const base64 = best.split(",")[1] ?? "";
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const path = `${userId}/selfie-${Date.now()}.jpg`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from("kyc-selfies")
    .upload(path, bytes, { contentType: "image/jpeg", upsert: true });

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({
      face_verification_status: "verified",
      face_verified_at: new Date().toISOString(),
      face_selfie_path: uploadError ? null : path,
    } as never)
    .eq("user_id", userId);

  if (updateError) return { error: "Could not save your face verification. Please retry." };

  return { status: "verified" };
}
