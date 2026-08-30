import { useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield, Copy, Upload, Clock, XCircle, Star, Crown, Check, Info, Loader2, CheckCircle2, Mail, Send } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SUPPORT_EMAIL = "bluepay9e@gmail.com";

const PAY_LINKS = {
  "5k": "https://pay.payswitch.africa/pay/62cb0abe-8909-43bc-ac71-1b0a3f5ed519",
  "10k": "https://pay.payswitch.africa/pay/43006d0f-1a64-405e-9df7-5976ff8b78f2",
} as const;

const ActivateBPC = () => {
  const { user, loading, supabaseUser, submitBPCProof } = useAuth();
  const navigate = useNavigate();
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "pending" | "approved" | "failed">("idle");
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  const handleResendReceipt = async () => {
    if (!supabaseUser) return;
    setResending(true);
    setResendMsg(null);
    try {
      const { data: sub, error: subErr } = await supabase
        .from("bpc_submissions")
        .select("id")
        .eq("user_id", supabaseUser.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (subErr || !sub) throw new Error("No receipt found to resend.");
      const { error: fnErr } = await supabase.functions.invoke("bpc-admin", {
        body: { submissionId: sub.id },
      });
      if (fnErr) throw new Error(fnErr.message);
      setResendMsg({ type: "success", text: "Receipt email resent successfully." });
    } catch (e: any) {
      setResendMsg({ type: "error", text: e.message || "Failed to resend receipt email." });
    } finally {
      setResending(false);
    }
  };

  const ResendButton = () => (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={handleResendReceipt}
        disabled={resending}
        className="w-full"
        aria-label="Resend receipt email to support"
      >
        {resending ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> Resending...</>
        ) : (
          <><Mail className="w-4 h-4 mr-2" aria-hidden="true" /> Resend receipt email</>
        )}
      </Button>
      {resendMsg && (
        <p
          role={resendMsg.type === "error" ? "alert" : "status"}
          aria-live={resendMsg.type === "error" ? "assertive" : "polite"}
          className={`text-xs text-center ${resendMsg.type === "error" ? "text-destructive" : "text-primary"}`}
        >
          {resendMsg.text}
        </p>
      )}
    </div>
  );

  if (loading) return null;
  if (!user || !supabaseUser) {
    navigate("/login");
    return null;
  }

  if (user.status === "approved") {
    return (
      <div className="min-h-screen bg-background">
        <Header onBack={() => navigate("/dashboard")} />
        <div className="max-w-md mx-auto px-4 mt-6">
          <div role="status" aria-live="polite" className="bg-card rounded-2xl p-6 shadow-lg border border-border text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-secondary mx-auto flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">HD CODE Already Activated ✅</h2>
            <p className="text-sm text-muted-foreground">Your withdrawals are now enabled.</p>
            <Button onClick={() => navigate("/dashboard")} className="w-full">Back to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  if (user.status === "pending") {
    return (
      <div className="min-h-screen bg-background">
        <Header onBack={() => navigate("/dashboard")} />
        <div className="max-w-md mx-auto px-4 mt-6">
          <div role="status" aria-live="polite" className="bg-card rounded-2xl p-6 shadow-lg border border-border text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-accent mx-auto flex items-center justify-center">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Payment Under Review ⏳</h2>
            <p className="text-sm text-muted-foreground">
              Your proof of payment has been submitted and is being reviewed. You will be notified once your HD CODE is activated.
            </p>
            <ResendButton />
            <Button onClick={() => navigate("/dashboard")} className="w-full">Back to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  if (user.status === "declined") {
    // Allow re-upload
  }

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      setError("");
      const reader = new FileReader();
      reader.onload = () => setProofPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitProof = async () => {
    if (!proofFile || !supabaseUser) return;

    const isImage = proofFile.type.startsWith("image/");
    const isPDF = proofFile.type === "application/pdf";
    if (!isImage && !isPDF) {
      setError("Please upload a valid image or PDF receipt.");
      setSubmitStatus("failed");
      return;
    }

    setSubmitting(true);
    setError("");
    setSubmitStatus("pending");

    try {
      // Upload to storage
      const filePath = `${supabaseUser.id}/${Date.now()}_${proofFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(filePath, proofFile);

      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(filePath);

      // Submit BPC proof
      const err = await submitBPCProof(urlData.publicUrl);
      if (err) throw new Error(err);
      setSubmitStatus("approved");
    } catch (e: any) {
      setError(e.message || "Failed to submit. Please try again.");
      setSubmitStatus("failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background">
        <Header onBack={() => navigate("/dashboard")} />

        <div className="max-w-md mx-auto px-4 mt-6">
          <div className="bg-card rounded-2xl p-6 shadow-lg border border-border space-y-5">

            {showConfirmation ? (
              <div className="space-y-5">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-secondary mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-primary" aria-hidden="true" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">Payment Confirmation</h2>
                  <p className="text-sm text-muted-foreground">
                    Payment received! Please send your payment receipt to the email below for verification
                  </p>
                </div>

                <div className="rounded-xl bg-secondary p-4 space-y-3 text-sm">
                  <p className="font-semibold text-foreground">Send receipt to:</p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" aria-hidden="true" />
                      <span>Support Email</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{SUPPORT_EMAIL}</span>
                      <button
                        type="button"
                        onClick={handleCopyEmail}
                        className="text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded p-1"
                        aria-label="Copy support email"
                      >
                        {emailCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {emailCopied && (
                    <p className="text-xs text-primary text-center" aria-live="polite">
                      Email copied to clipboard!
                    </p>
                  )}
                </div>

                <section aria-labelledby="proof-heading-confirm" className="space-y-3">
                  <div className="space-y-1">
                    <h3 id="proof-heading-confirm" className="text-sm font-semibold text-foreground">
                      Upload Receipt (Optional)
                    </h3>
                    <p id="proof-desc-confirm" className="text-xs text-muted-foreground">
                      You can also upload your payment receipt here for faster verification.
                    </p>
                  </div>
                  <Label htmlFor="proof-confirm" className="sr-only">Upload proof of payment file</Label>
                  <ReceiptStatus status={submitStatus} fileName={proofFile?.name} errorMessage={error} />
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-4 text-center"
                    aria-describedby="proof-desc-confirm"
                  >
                    {proofPreview ? (
                      <div className="space-y-3">
                        {proofFile?.type === "application/pdf" ? (
                          <div className="flex flex-col items-center gap-2 py-6" aria-hidden="true">
                            <Upload className="w-8 h-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">PDF receipt ready</span>
                          </div>
                        ) : (
                          <img
                            src={proofPreview}
                            alt={`Uploaded payment receipt: ${proofFile?.name ?? "receipt"}`}
                            className="max-h-48 mx-auto rounded-lg object-contain"
                          />
                        )}
                        <p className="text-xs text-muted-foreground">
                          <span className="sr-only">Selected file: </span>
                          {proofFile?.name}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <a
                            href={proofPreview}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`View uploaded receipt ${proofFile?.name ?? ""} in a new tab`}
                            className="text-xs font-medium text-primary underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                          >
                            View receipt
                          </a>
                          <a
                            href={proofPreview}
                            download={proofFile?.name}
                            aria-label={`Download uploaded receipt ${proofFile?.name ?? ""}`}
                            className="text-xs font-medium text-primary underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                          >
                            Download receipt
                          </a>
                          <button
                            type="button"
                            onClick={() => { setProofFile(null); setProofPreview(null); setError(""); }}
                            aria-label="Remove uploaded receipt and choose a different file"
                            className="text-xs font-medium text-destructive underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 rounded"
                          >
                            Remove & re-upload
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label htmlFor="proof-confirm" className="cursor-pointer flex flex-col items-center gap-2 py-4">
                        <Upload className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
                        <span className="text-sm text-muted-foreground">Tap to upload screenshot or receipt</span>
                        <span className="text-xs text-muted-foreground">(Image or PDF only)</span>
                      </label>
                    )}
                    <input
                      id="proof-confirm"
                      type="file"
                      accept="image/*,application/pdf"
                      className="sr-only"
                      onChange={handleFileChange}
                      aria-describedby="proof-desc-confirm"
                    />
                  </div>
                </section>

                {error && (
                  <div role="alert" aria-live="assertive" className="flex items-center gap-2 bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button onClick={handleSubmitProof} className="w-full" disabled={!proofFile || submitting}>
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> Submitting...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" aria-hidden="true" /> Submit Receipt</>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowConfirmation(false); }}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                  Back to Payment Options
                </Button>
              </div>
            ) : (
              <>
            <div className="text-center">
              <Shield className="w-12 h-12 text-primary mx-auto mb-3" aria-hidden="true" />
              <h2 className="text-lg font-bold text-foreground">HD CODE Activation</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {user.status === "declined"
                  ? "Your previous proof was declined. Please pay again and upload a valid receipt."
                  : "To activate your HD CODE and enable withdrawals, choose a payment option below, then upload your proof of payment."}
              </p>
              <div className="text-left mt-3 space-y-2 bg-secondary rounded-xl p-3">
                <p className="text-sm text-foreground">
                  <span className="sr-only">Option 1:</span>
                  • Pay <span className="font-bold text-primary">₦5,000</span> and get an HD CODE to withdraw <span className="font-bold">₦100,000</span> (half of ₦200,000).
                </p>
                <p className="text-sm text-foreground">
                  <span className="sr-only">Option 2:</span>
                  • Pay <span className="font-bold text-primary">₦10,000</span> and get an HD CODE to withdraw the full <span className="font-bold">₦200,000</span> to your bank account.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* 5K Tier */}
              <div className="relative rounded-2xl border-2 border-border bg-card overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-secondary-foreground/60" />
                <div className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <Star className="w-5 h-5 text-secondary-foreground" aria-label="Starter tier icon" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Starter tier — withdraw half your balance</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">Starter</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">Half Access</span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>Withdraw ₦100,000 (50% of total balance)</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Withdraw ₦100,000</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-foreground">₦5,000</span>
                    <Button
                      asChild
                      className="inline-flex items-center gap-1.5 rounded-lg py-2.5 px-4 font-semibold text-sm"
                    >
                      <a
                        href={PAY_LINKS["5k"]}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowConfirmation(true)}
                        aria-label="Pay ₦5,000 for Starter HD Code"
                      >
                        <Check className="w-4 h-4" aria-hidden="true" />
                        Pay ₦5,000
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              {/* 10K Tier */}
              <div className="relative rounded-2xl border-2 border-primary/40 bg-card overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
                <div className="absolute top-3 right-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold uppercase tracking-wide">Best Value</span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Unlock your full ₦200,000 balance</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Crown className="w-5 h-5 text-primary" aria-label="Premium tier icon" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Premium tier — withdraw your full balance</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">Premium</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Withdraw ₦200,000</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-foreground">₦10,000</span>
                    <Button
                      asChild
                      className="inline-flex items-center gap-1.5 rounded-lg py-2.5 px-4 font-semibold text-sm"
                    >
                      <a
                        href={PAY_LINKS["10k"]}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowConfirmation(true)}
                        aria-label="Pay ₦10,000 for Premium HD Code"
                      >
                        <Check className="w-4 h-4" aria-hidden="true" />
                        Pay ₦10,000
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

        </>
      )}
      </div>
      </div>
    </div>
    </TooltipProvider>
  );
};

const Header = ({ onBack }: { onBack: () => void }) => (
  <header className="hero-gradient px-4 py-6">
    <div className="max-w-md mx-auto flex items-center gap-3">
      <button onClick={onBack} className="text-primary-foreground">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h1 className="text-lg font-bold text-primary-foreground">Activate HD CODE</h1>
    </div>
  </header>
);

export default ActivateBPC;

const ReceiptStatus = ({
  status,
  fileName,
  errorMessage,
}: {
  status: "idle" | "pending" | "approved" | "failed";
  fileName?: string;
  errorMessage?: string;
}) => {
  if (status === "idle") {
    return (
      <div role="status" aria-live="polite" className="sr-only">
        {fileName ? `Receipt ${fileName} ready to submit.` : "No receipt uploaded yet."}
      </div>
    );
  }

  const config = {
    pending: {
      Icon: Loader2,
      iconClass: "text-primary animate-spin",
      wrap: "bg-accent/40 border-primary/30 text-foreground",
      title: "Processing receipt",
      desc: "Uploading and submitting your proof of payment. Please wait.",
      live: "polite" as const,
      role: "status" as const,
    },
    approved: {
      Icon: CheckCircle2,
      iconClass: "text-primary",
      wrap: "bg-secondary border-secondary-foreground/30 text-foreground",
      title: "Receipt submitted",
      desc: "Your proof of payment was received and is now under review.",
      live: "polite" as const,
      role: "status" as const,
    },
    failed: {
      Icon: XCircle,
      iconClass: "text-destructive",
      wrap: "bg-destructive/10 border-destructive/30 text-destructive",
      title: "Submission failed",
      desc: errorMessage || "We couldn't submit your receipt. Please try again.",
      live: "assertive" as const,
      role: "alert" as const,
    },
  }[status];

  const { Icon } = config;
  return (
    <div
      role={config.role}
      aria-live={config.live}
      aria-atomic="true"
      className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${config.wrap}`}
    >
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.iconClass}`} aria-hidden="true" />
      <div className="flex-1">
        <p className="font-semibold">{config.title}</p>
        <p className="text-xs opacity-90">{config.desc}</p>
      </div>
    </div>
  );
};
