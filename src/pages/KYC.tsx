import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
} from "lucide-react";

import { verifyIdentityFn } from "@/lib/backend.functions";
type KycStatus = "not_verified" | "pending" | "verified" | "failed";
type Kind = "nin" | "bvn";

const STATUS_META: Record<
  KycStatus,
  { label: string; className: string; icon: React.ReactElement }
> = {
  not_verified: {
    label: "Not Verified",
    className: "bg-secondary text-secondary-foreground",
    icon: <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />,
  },
  pending: {
    label: "Verification Pending",
    className: "bg-amber-100 text-amber-900",
    icon: <Clock className="w-3.5 h-3.5" aria-hidden="true" />,
  },
  verified: {
    label: "Verified",
    className: "bg-emerald-100 text-emerald-900",
    icon: <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />,
  },
  failed: {
    label: "Verification Failed",
    className: "bg-destructive/10 text-destructive",
    icon: <XCircle className="w-3.5 h-3.5" aria-hidden="true" />,
  },
};

const StatusBadge = ({ status }: { status: KycStatus }) => {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
};

const KYC = () => {
  const { user, loading, kyc, refreshKyc } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState<Kind | null>(null);
  const [value, setValue] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  const tier = kyc.tier;
  const ninStatus = kyc.nin;
  const bvnStatus = kyc.bvn;
  const progress = tier === 2 ? 100 : tier === 1 ? 50 : 0;

  const startForm = (kind: Kind) => {
    setOpen(kind);
    setValue("");
    setConsent(false);
    setError("");
    setSuccess("");
  };

  const submit = async (kind: Kind) => {
    setError("");
    setSuccess("");
    if (!/^\d{11}$/.test(value)) {
      setError(`Your ${kind.toUpperCase()} must be exactly 11 digits.`);
      return;
    }
    if (!consent) {
      setError("Please give consent before we verify your identity.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await verifyIdentityFn({ data: { kind, id: value, consent: true } }).catch(
        () => ({ error: "We could not complete verification. Please try again." }),
      );
      // Clear the sensitive value from memory as soon as it has been sent.
      setValue("");

      const message = (data as { error?: string } | null)?.error ?? "";

      if (message) {
        setError(message);
      } else {
        setSuccess(
          kind === "nin"
            ? "NIN verified. Your account is now Tier 1 — NIN Verified."
            : "BVN verified. Your account is now Tier 2 — BVN Verified.",
        );
        setOpen(null);
        setConsent(false);
      }
      await refreshKyc();
    } finally {
      setSubmitting(false);
    }
  };

  const TierCard = ({
    kind,
    title,
    subtitle,
    status,
    locked,
    lockedNote,
    explanation,
  }: {
    kind: Kind;
    title: string;
    subtitle: string;
    status: KycStatus;
    locked: boolean;
    lockedNote?: string;
    explanation: string;
  }) => (
    <section className="bg-card rounded-2xl p-5 shadow-sm border border-border">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <p className="text-sm text-muted-foreground mt-3">{explanation}</p>

      {status === "verified" ? null : locked ? (
        <p className="mt-4 text-xs font-medium text-muted-foreground">{lockedNote}</p>
      ) : open === kind ? (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit(kind);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor={`${kind}-input`}>{kind.toUpperCase()} (11 digits)</Label>
            <Input
              id={`${kind}-input`}
              inputMode="numeric"
              autoComplete="off"
              maxLength={11}
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder={`Enter your ${kind.toUpperCase()}`}
              aria-describedby={`${kind}-privacy`}
            />
            <p id={`${kind}-privacy`} className="text-xs text-muted-foreground">
              Sent securely to our verification partner. We never store your{" "}
              {kind.toUpperCase()} number.
            </p>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id={`${kind}-consent`}
              checked={consent}
              onCheckedChange={(c) => setConsent(c === true)}
            />
            <Label htmlFor={`${kind}-consent`} className="text-xs font-normal leading-snug">
              I consent to Hope Drop verifying my identity with an authorised KYC provider using
              this {kind.toUpperCase()}.
            </Label>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> Verifying…
                </>
              ) : (
                "Verify Now"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(null)} disabled={submitting}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button className="mt-4 w-full sm:w-auto" onClick={() => startForm(kind)}>
          {status === "failed" ? "Retry Verification" : kind === "nin" ? "Verify Now" : "Upgrade to Tier 2"}
        </Button>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="hero-gradient px-4 py-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="text-primary-foreground" aria-label="Back to dashboard">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-primary-foreground">KYC Verification</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-6 space-y-4 pb-10">
        <section className="bg-card rounded-2xl p-6 shadow-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current account tier</p>
              <p className="text-lg font-bold text-foreground">
                {tier === 2 ? "Tier 2 — BVN Verified" : tier === 1 ? "Tier 1 — NIN Verified" : "Tier 0 — Unverified"}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Verification progress</span>
              <span>{progress}%</span>
            </div>
            <div
              className="h-2 rounded-full bg-secondary overflow-hidden"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Verification progress"
            >
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {tier === 0 && (
            <p className="mt-4 text-sm text-secondary-foreground bg-secondary rounded-xl p-3">
              Your account is unverified. Complete verification to unlock higher account limits and
              full access to withdrawals and services.
            </p>
          )}
        </section>

        <div aria-live="polite" className="space-y-3">
          {success && (
            <p className="rounded-xl bg-emerald-100 text-emerald-900 text-sm p-3 font-medium">{success}</p>
          )}
          {error && (
            <p role="alert" className="rounded-xl bg-destructive/10 text-destructive text-sm p-3 font-medium">
              {error}
            </p>
          )}
        </div>

        <TierCard
          kind="nin"
          title="Tier 1 — NIN Verification"
          subtitle="National Identification Number"
          status={ninStatus}
          locked={false}
          explanation="We verify your NIN to confirm you are a real, identifiable person. This is required by Nigerian financial regulations and protects your account from fraud and impersonation."
        />

        <TierCard
          kind="bvn"
          title="Tier 2 — BVN Verification"
          subtitle="Bank Verification Number"
          status={bvnStatus}
          locked={ninStatus !== "verified"}
          lockedNote="Complete Tier 1 (NIN) verification first to unlock Tier 2."
          explanation="Your BVN links your identity to your bank records, enabling higher withdrawal limits. It is sent directly to our licensed verification partner over an encrypted connection — never stored by Hope Drop."
        />

        <section className="rounded-2xl border border-border bg-secondary p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-secondary-foreground">
            <Lock className="w-4 h-4" aria-hidden="true" /> Secure &amp; private
          </h2>
          <ul className="mt-2 space-y-1 text-xs text-secondary-foreground list-disc pl-5">
            <li>Verification runs on our secure servers — provider keys are never exposed to your browser.</li>
            <li>We store only your verification status and date, never your NIN or BVN number.</li>
            <li>Only you can view or change your own verification information.</li>
            <li>Attempts are rate limited to protect against abuse.</li>
          </ul>
        </section>
      </main>
    </div>
  );
};

export default KYC;
