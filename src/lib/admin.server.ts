import type { SupabaseClient } from "@supabase/supabase-js";

export interface AdminCustomer {
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  balance: number;
  blocked: boolean;
  hdCode: string | null;
  referralId: string;
  createdAt: string;
}

async function assertAdmin(supabase: SupabaseClient<any>, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

export async function listCustomers(supabase: SupabaseClient<any>, userId: string): Promise<AdminCustomer[]> {
  await assertAdmin(supabase, userId);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select("user_id, full_name, phone, balance, blocked, hd_code, referral_id, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);

  const emails = new Map<string, string>();
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  (authUsers?.users ?? []).forEach((u) => emails.set(u.id, u.email ?? ""));

  return (profiles ?? []).map((p: any) => ({
    userId: p.user_id,
    fullName: p.full_name ?? "",
    phone: p.phone ?? "",
    email: emails.get(p.user_id) ?? "",
    balance: Number(p.balance ?? 0),
    blocked: Boolean(p.blocked),
    hdCode: p.hd_code ?? null,
    referralId: p.referral_id ?? "",
    createdAt: p.created_at,
  }));
}

export async function setCustomerBlocked(
  supabase: SupabaseClient<any>,
  adminId: string,
  targetUserId: string,
  blocked: boolean,
) {
  await assertAdmin(supabase, adminId);
  if (targetUserId === adminId) throw new Error("You cannot block your own account");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ blocked })
    .eq("user_id", targetUserId);
  if (error) throw new Error(error.message);

  // Ban/unban at the auth level so blocked customers cannot sign in at all.
  const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
    ban_duration: blocked ? "876000h" : "none",
  } as any);
  if (banError) throw new Error(banError.message);

  return { ok: true, blocked };
}

export async function deleteCustomer(
  supabase: SupabaseClient<any>,
  adminId: string,
  targetUserId: string,
) {
  await assertAdmin(supabase, adminId);
  if (targetUserId === adminId) throw new Error("You cannot delete your own account");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  await supabaseAdmin.from("support_threads").delete().eq("user_id", targetUserId);

  const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
  if (error) throw new Error(error.message);
  return { ok: true };
}
