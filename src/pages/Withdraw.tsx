import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowDownCircle, Loader2, CheckCircle2 } from "lucide-react";

type Bank = { name: string; code: string };

const Withdraw = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const [amount, setAmount] = useState("80000");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.functions.invoke("resolve-account", {
        body: { action: "banks" },
      });
      if (!active) return;
      if (error || !data?.banks) {
        setVerifyError("Could not load bank list. Please try again.");
      } else {
        setBanks(data.banks as Bank[]);
      }
      setBanksLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const verify = useCallback(async (code: string, number: string) => {
    setVerifying(true);
    setVerifyError("");
    setAccountName("");
    setConfirmed(false);
    const { data, error } = await supabase.functions.invoke("resolve-account", {
      body: { action: "resolve", bank_code: code, account_number: number },
    });
    setVerifying(false);
    if (error || !data?.account_name) {
      setVerifyError("Invalid account number for selected bank.");
      return;
    }
    setAccountName(data.account_name as string);
  }, []);

  // Auto-verify when both bank and a valid 10-digit number are present
  useEffect(() => {
    if (bankCode && /^\d{10}$/.test(accountNumber)) {
      const t = setTimeout(() => verify(bankCode, accountNumber), 300);
      return () => clearTimeout(t);
    }
    setAccountName("");
    setConfirmed(false);
    setVerifyError("");
  }, [bankCode, accountNumber, verify]);

  if (loading || !user) return null;

  const bankName = banks.find((b) => b.code === bankCode)?.name ?? "";

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (user.status !== "approved") {
      if (user.status === "pending") {
        setError("Your HD CODE activation is under review. Please wait for verification.");
      } else if (user.status === "declined") {
        setError("Your HD CODE activation was declined. Please re-submit a valid proof of payment.");
      } else {
        setError("You must activate your HD CODE before you can withdraw. Please go to Activate HD CODE.");
      }
      return;
    }

    if (!confirmed || !accountName) {
      setError("Please verify and confirm your bank account first.");
      return;
    }

    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (num > user.balance) {
      setError("Insufficient balance");
      return;
    }

    setSuccess(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="hero-gradient px-4 py-6">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="text-primary-foreground" aria-label="Back to dashboard">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-primary-foreground">Withdraw Funds</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 mt-6 pb-10">
        {success ? (
          <div className="bg-card rounded-2xl p-6 shadow-lg border border-border text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-secondary mx-auto flex items-center justify-center">
              <ArrowDownCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Withdrawal Processing</h2>
            <p className="text-sm text-muted-foreground">
              ₦{Number(amount).toLocaleString()} is being sent to {accountName} ({bankName} - {accountNumber}). Please allow 24-48 hours for processing.
            </p>
            <Button onClick={() => navigate("/dashboard")} className="w-full">Back to Dashboard</Button>
          </div>
        ) : (
          <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
            <div className="mb-4 p-3 rounded-xl bg-secondary">
              <p className="text-sm font-medium text-secondary-foreground">
                Available: ₦{user.balance.toLocaleString()}.00
              </p>
            </div>

            <h2 className="text-base font-semibold text-foreground mb-3">Bank Transfer</h2>

            <form onSubmit={handleWithdraw} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg" role="alert">{error}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="bank">Bank</Label>
                <select
                  id="bank"
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  disabled={banksLoading}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                >
                  <option value="">{banksLoading ? "Loading banks…" : "Select your bank"}</option>
                  {banks.map((b) => (
                    <option key={`${b.code}-${b.name}`} value={b.code}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account">Account Number</Label>
                <Input
                  id="account"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="0123456789"
                  maxLength={10}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  aria-describedby="account-help"
                />
                <p id="account-help" className="text-xs text-muted-foreground">
                  {accountNumber.length > 0 && accountNumber.length < 10
                    ? `${10 - accountNumber.length} more digit(s) needed`
                    : "Enter your 10-digit account number"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  readOnly
                  value={verifying ? "Verifying…" : accountName}
                  placeholder="Auto-filled after verification"
                  className="bg-secondary/60"
                />
                <div aria-live="polite" className="min-h-[1rem]">
                  {verifying && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" /> Verifying account…
                    </p>
                  )}
                  {!verifying && verifyError && (
                    <p className="text-xs text-destructive">{verifyError}</p>
                  )}
                  {!verifying && accountName && (
                    <p className="text-xs text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-primary" aria-hidden="true" /> Account verified
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="button"
                variant={confirmed ? "secondary" : "outline"}
                className="w-full"
                disabled={!accountName || verifying}
                onClick={() => setConfirmed(true)}
              >
                {confirmed ? "Account Confirmed" : "Confirm Account"}
              </Button>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input id="amount" type="number" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>

              <Button type="submit" className="w-full" disabled={!confirmed}>
                Withdraw ₦{Number(amount || 0).toLocaleString()}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Your account number is used only for verification and is never stored.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Withdraw;
