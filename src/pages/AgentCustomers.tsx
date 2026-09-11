import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  adminListCustomersFn,
  adminSetCustomerBlockedFn,
  adminDeleteCustomerFn,
} from "@/lib/backend.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, Loader2, Ban, CheckCircle2, Trash2 } from "lucide-react";

interface Customer {
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

const AgentCustomers = () => {
  const { user, loading } = useAuth();
  const { isAdmin, checking } = useIsAdmin();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [working, setWorking] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/admin-login");
  }, [user, loading, navigate]);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setBusy(true);
    setError("");
    try {
      const list = (await adminListCustomersFn({ data: {} as never })) as Customer[];
      setCustomers(list);
    } catch (e: any) {
      setError(e?.message || "Could not load customers.");
    }
    setBusy(false);
  }, [isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleBlock = async (c: Customer) => {
    setWorking(c.userId);
    setError("");
    try {
      await adminSetCustomerBlockedFn({ data: { userId: c.userId, blocked: !c.blocked } });
      setCustomers((prev) =>
        prev.map((p) => (p.userId === c.userId ? { ...p, blocked: !c.blocked } : p)),
      );
    } catch (e: any) {
      setError(e?.message || "Could not update this account.");
    }
    setWorking(null);
  };

  const remove = async (c: Customer) => {
    if (!window.confirm(`Permanently delete ${c.fullName || c.email}? This cannot be undone.`)) return;
    setWorking(c.userId);
    setError("");
    try {
      await adminDeleteCustomerFn({ data: { userId: c.userId } });
      setCustomers((prev) => prev.filter((p) => p.userId !== c.userId));
    } catch (e: any) {
      setError(e?.message || "Could not delete this account.");
    }
    setWorking(null);
  };

  if (loading || checking) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 gap-4">
        <p className="text-sm text-muted-foreground text-center">
          This page is only available to support agents.
        </p>
        <Button variant="outline" onClick={() => navigate("/admin-login")}>
          Sign in as an agent
        </Button>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const filtered = q
    ? customers.filter((c) =>
        [c.fullName, c.email, c.phone, c.hdCode ?? "", c.referralId]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    : customers;

  return (
    <div className="min-h-screen bg-background">
      <header className="hero-gradient px-4 pt-6 pb-10">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/agent-inbox")} className="text-primary-foreground" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Users className="w-5 h-5 text-primary-foreground" />
          <h1 className="text-lg font-bold text-primary-foreground">Customer Accounts</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 -mt-4 space-y-3 pb-10">
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, phone or HD code"
            className="h-11 rounded-xl"
          />
          <p className="text-xs text-muted-foreground">
            {busy ? "Loading…" : `${filtered.length} customer${filtered.length === 1 ? "" : "s"}`}
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {busy ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2 p-3">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading customers…
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground p-3">No customers found.</p>
        ) : (
          filtered.map((c) => (
            <div key={c.userId} className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{c.fullName || "No name"}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.email || "No email"}</p>
                  <p className="text-xs text-muted-foreground">{c.phone || "No phone"}</p>
                  <p className="text-xs text-muted-foreground">
                    Balance ₦{c.balance.toLocaleString()} · HD {c.hdCode || "not issued"} · Joined{" "}
                    {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-[11px] px-2 py-1 rounded-full ${
                    c.blocked ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                  }`}
                >
                  {c.blocked ? "Blocked" : "Active"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={working === c.userId}
                  onClick={() => toggleBlock(c)}
                >
                  {c.blocked ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-1" aria-hidden="true" /> Unblock
                    </>
                  ) : (
                    <>
                      <Ban className="w-4 h-4 mr-1" aria-hidden="true" /> Block
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={working === c.userId}
                  onClick={() => remove(c)}
                >
                  <Trash2 className="w-4 h-4 mr-1" aria-hidden="true" /> Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AgentCustomers;
