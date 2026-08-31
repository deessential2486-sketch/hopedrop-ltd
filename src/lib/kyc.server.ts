import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getProvider, type KycKind } from "./kyc-providers.server";

// SECURITY NOTES
// - NIN/BVN values are never logged, never persisted, and never returned.
// - Provider credentials live in environment variables (server side only).
// - Users can only affect their own profile.

const MAX_ATTEMPTS_PER_HOUR = 5;

export type KycVerifyResult =
  | { status: "verified"; tier: number }
  | { error: string; retryable?: boolean; status?: "failed"; code?: string };

export async function verifyIdentity(
  userId: string,
  kind: KycKind,
  id: string,
  consent: boolean,
): Promise<KycVerifyResult> {
  if (kind !== "nin" && kind !== "bvn") {
    return { error: "Invalid verification type." };
  }
  if (!consent) {
    return { error: "Your consent is required before we can verify your identity." };
  }
  if (!/^\d{11}$/.test(id)) {
    return { error: `Your ${(kind as string).toUpperCase()} must be exactly 11 digits.` };
  }

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("kyc_verification_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  if ((count ?? 0) >= MAX_ATTEMPTS_PER_HOUR) {
    return { error: "Too many verification attempts. Please try again in an hour." };
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("verification_tier, nin_verification_status, bvn_verification_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile) return { error: "Profile not found." };

  if (kind === "nin" && profile.nin_verification_status === "verified") {
    return { error: "Your NIN is already verified." };
  }
  if (kind === "bvn") {
    if (profile.nin_verification_status !== "verified") {
      return { error: "Complete Tier 1 (NIN) verification first." };
    }
    if (profile.bvn_verification_status === "verified") {
      return { error: "Your BVN is already verified." };
    }
  }

  const provider = getProvider();
  if (!provider) {
    return {
      error:
        "Identity verification is not available yet — the KYC provider has not been configured. Please contact support.",
      code: "provider_not_configured",
    };
  }

  const statusCol = kind === "nin" ? "nin_verification_status" : "bvn_verification_status";
  const verifiedCol = kind === "nin" ? "nin_verified_at" : "bvn_verified_at";

  await supabaseAdmin.from("profiles").update({ [statusCol]: "pending" } as never).eq("user_id", userId);

  let result;
  try {
    result = await provider.verify(kind, id);
  } catch {
    // Deliberately not logging the error payload — it may echo the ID.
    result = {
      ok: false as const,
      message: "Verification service is unreachable. Please retry.",
      retryable: true,
    };
  }

  await supabaseAdmin.from("kyc_verification_attempts").insert({
    user_id: userId,
    kind,
    provider: provider.name,
    succeeded: result.ok,
    reference: result.ok ? (result.reference ?? null) : null,
  });

  if (!result.ok) {
    await supabaseAdmin.from("profiles").update({ [statusCol]: "failed" } as never).eq("user_id", userId);
    return { error: result.message, retryable: result.retryable, status: "failed" };
  }

  const tier = kind === "nin" ? Math.max(1, profile.verification_tier ?? 0) : 2;

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({
      [statusCol]: "verified",
      [verifiedCol]: new Date().toISOString(),
      verification_tier: tier,
    })
    .eq("user_id", userId);

  if (updateError) return { error: "Could not save your verification. Please retry." };

  return { status: "verified", tier };
}
