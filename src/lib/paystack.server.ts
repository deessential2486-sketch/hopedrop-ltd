export type Bank = { name: string; code: string };

function auth() {
  const key = process.env["PAYSTACK_SECRET_KEY"];
  if (!key) return null;
  return { Authorization: `Bearer ${key}` };
}

export async function listBanks(): Promise<{ banks: Bank[] } | { error: string }> {
  const headers = auth();
  if (!headers) return { error: "Payment provider is not configured." };

  const res = await fetch("https://api.paystack.co/bank?country=nigeria&perPage=100", { headers });
  const data = (await res.json().catch(() => ({}))) as {
    status?: boolean;
    message?: string;
    data?: Bank[];
  };
  if (!res.ok || !data.status || !data.data) {
    return { error: data.message ?? "Could not load banks" };
  }
  const banks = data.data
    .map((b) => ({ name: b.name, code: b.code }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { banks };
}

export async function resolveAccount(
  bank_code: string,
  account_number: string,
): Promise<{ account_name: string } | { error: string }> {
  const headers = auth();
  if (!headers) return { error: "Payment provider is not configured." };

  if (!/^\d{10}$/.test(account_number)) {
    return { error: "Account number must be exactly 10 digits." };
  }
  if (!/^\d{3,6}$/.test(bank_code)) {
    return { error: "Invalid bank selected." };
  }

  const res = await fetch(
    `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
    { headers },
  );
  const data = (await res.json().catch(() => ({}))) as {
    status?: boolean;
    data?: { account_name?: string };
  };
  if (!res.ok || !data.status || !data.data?.account_name) {
    return { error: "Invalid account number for selected bank." };
  }
  // Only the resolved name is returned; nothing is persisted.
  return { account_name: data.data.account_name };
}
