import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const notifyBpcSubmissionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { submissionId: string }) => ({
    submissionId: String(data?.submissionId ?? ""),
  }))
  .handler(async ({ data, context }) => {
    const { notifyBpcSubmission } = await import("./bpc.server");
    const origin = new URL(getRequest().url).origin;
    return notifyBpcSubmission(context.userId, data.submissionId, origin);
  });

export const listBanksFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { listBanks } = await import("./paystack.server");
    return listBanks();
  });

export const resolveAccountFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bank_code: string; account_number: string }) => ({
    bank_code: String(data?.bank_code ?? ""),
    account_number: String(data?.account_number ?? ""),
  }))
  .handler(async ({ data }) => {
    const { resolveAccount } = await import("./paystack.server");
    return resolveAccount(data.bank_code, data.account_number);
  });

export const verifyIdentityFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { kind: "nin" | "bvn"; id: string; consent: boolean }) => ({
    kind: data?.kind,
    id: String(data?.id ?? "").trim(),
    consent: data?.consent === true,
  }))
  .handler(async ({ data, context }) => {
    const { verifyIdentity } = await import("./kyc.server");
    return verifyIdentity(context.userId, data.kind, data.id, data.consent);
  });

export const verifyFaceFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { frames: string[] }) => ({
    frames: Array.isArray(data?.frames) ? data.frames.map(String) : [],
  }))
  .handler(async ({ data, context }) => {
    const { verifyFace } = await import("./face.server");
    return verifyFace(context.userId, data.frames);
  });

export const checkHdCodeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { code: string }) => ({ code: String(data?.code ?? "").slice(0, 32) }))
  .handler(async ({ data, context }) => {
    const { checkHdCode } = await import("./hdcode.server");
    return checkHdCode(context.userId, data.code);
  });
