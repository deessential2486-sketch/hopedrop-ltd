// Provider-agnostic KYC adapter layer.
// Swap providers by changing the KYC_PROVIDER env var — no app changes required.
// NOTE: never log NIN/BVN values anywhere in this file.

export type KycKind = "nin" | "bvn";

export type KycResult =
  | { ok: true; reference?: string; firstName?: string; lastName?: string }
  | { ok: false; message: string; retryable: boolean };

export interface KycProvider {
  readonly name: string;
  verify(kind: KycKind, id: string): Promise<KycResult>;
}

const failed = (message: string, retryable = true): KycResult => ({
  ok: false,
  message,
  retryable,
});

/** Dojah (https://dojah.io) — KYC_API_KEY + DOJAH_APP_ID */
function dojah(apiKey: string, appId: string): KycProvider {
  const base = "https://api.dojah.io/api/v1/kyc";
  return {
    name: "dojah",
    async verify(kind, id) {
      const url =
        kind === "nin"
          ? `${base}/nin?nin=${encodeURIComponent(id)}`
          : `${base}/bvn/full?bvn=${encodeURIComponent(id)}`;
      const res = await fetch(url, {
        headers: { Authorization: apiKey, AppId: appId },
      });
      const body = await res.json().catch(() => ({}) as Record<string, unknown>);
      if (!res.ok) {
        return failed(
          typeof (body as { error?: string })?.error === "string"
            ? (body as { error: string }).error
            : "We could not verify this ID with our provider.",
          res.status >= 500 || res.status === 429,
        );
      }
      const entity = (body as { entity?: Record<string, string> })?.entity;
      if (!entity) return failed("No matching record was found for this ID.", true);
      return {
        ok: true,
        reference: entity["reference"] ?? undefined,
        firstName: entity["first_name"] ?? entity["firstName"],
        lastName: entity["last_name"] ?? entity["lastName"],
      };
    },
  };
}

/** QoreID (https://qoreid.com) — KYC_API_KEY holds a bearer token */
function qoreid(token: string): KycProvider {
  return {
    name: "qoreid",
    async verify(kind, id) {
      const res = await fetch(
        `https://api.qoreid.com/v1/ng/identities/${kind}-basic/${encodeURIComponent(id)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );
      const body = (await res.json().catch(() => ({}))) as Record<string, any>;
      if (!res.ok) {
        return failed(
          typeof body?.["message"] === "string"
            ? body["message"]
            : "Verification could not be completed.",
          res.status >= 500 || res.status === 429,
        );
      }
      const data = body?.[kind] ?? body?.["data"];
      if (!data) return failed("No matching record was found for this ID.", true);
      return {
        ok: true,
        reference: body?.["id"] ? String(body["id"]) : undefined,
        firstName: data?.firstname ?? data?.firstName,
        lastName: data?.lastname ?? data?.lastName,
      };
    },
  };
}

/** Prembly / Identitypass — KYC_API_KEY + PREMBLY_APP_ID */
function prembly(apiKey: string, appId: string): KycProvider {
  return {
    name: "prembly",
    async verify(kind, id) {
      const res = await fetch(`https://api.prembly.com/identitypass/verification/${kind}`, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          app_id: appId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ number: id }),
      });
      const body = (await res.json().catch(() => ({}))) as Record<string, any>;
      if (!res.ok || body?.["status"] === false) {
        return failed(
          typeof body?.["message"] === "string"
            ? body["message"]
            : "Verification could not be completed.",
          res.status >= 500 || res.status === 429,
        );
      }
      const data = body?.["data"];
      if (!data) return failed("No matching record was found for this ID.", true);
      return {
        ok: true,
        reference: body?.["verification"]?.reference ?? undefined,
        firstName: data?.firstName ?? data?.first_name,
        lastName: data?.lastName ?? data?.last_name,
      };
    },
  };
}

/**
 * Resolves the configured provider. Returns null when the environment is not
 * configured — callers must then refuse the request (never fake a result).
 */
export function getProvider(): KycProvider | null {
  const apiKey = process.env["KYC_API_KEY"];
  if (!apiKey) return null;
  const name = (process.env["KYC_PROVIDER"] ?? "dojah").toLowerCase();

  switch (name) {
    case "dojah": {
      const appId = process.env["DOJAH_APP_ID"];
      return appId ? dojah(apiKey, appId) : null;
    }
    case "qoreid":
      return qoreid(apiKey);
    case "prembly": {
      const appId = process.env["PREMBLY_APP_ID"];
      return appId ? prembly(apiKey, appId) : null;
    }
    default:
      return null;
  }
}
