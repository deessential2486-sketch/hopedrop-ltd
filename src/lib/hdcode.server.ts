import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function checkHdCode(
  userId: string,
  code: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const entered = code.trim().toUpperCase();
  if (!entered) return { ok: false, message: "Enter the HD CODE sent to your email." };

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("hd_code")
    .eq("user_id", userId)
    .maybeSingle();

  const stored = (profile as { hd_code?: string | null } | null)?.hd_code ?? null;
  if (!stored) {
    return {
      ok: false,
      message: "No HD CODE has been issued yet. Activate your HD CODE first.",
    };
  }
  if (stored.toUpperCase() !== entered) {
    return { ok: false, message: "Incorrect HD CODE. Check the code sent to your email." };
  }
  return { ok: true };
}
