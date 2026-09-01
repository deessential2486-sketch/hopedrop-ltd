import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Copy, Check, Share2, Users, Gift } from "lucide-react";
import { toast } from "sonner";

interface ReferralRow {
  id: string;
  status: string;
  bonus_amount: number;
  created_at: string;
}

const Referrals = () => {
  const { user, supabaseUser, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<ReferralRow[]>([]);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!supabaseUser) return;
    supabase
      .from("referrals")
      .select("id, status, bonus_amount, created_at")
      .eq("referrer_user_id", supabaseUser.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data as ReferralRow[]) ?? []));
  }, [supabaseUser]);

  if (loading || !user) return null;

  const code = user.referralId;
  const link = code ? `${origin}/register?ref=${code}` : "";
  const successful = rows.filter((r) => r.status === "successful");
  const earned = successful.reduce((sum, r) => sum + Number(r.bonus_amount || 0), 0);

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Referral link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (!link) return;
    const text = `Join me on Hope Drop and get rewarded. Sign up with my link: ${link}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Hope Drop", text, url: link });
        return;
      } catch {
        /* user cancelled */
      }
    }
    await navigator.clipboard.writeText(text);
    toast.success("Invite message copied");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="hero-gradient px-4 py-6">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="text-primary-foreground" aria-label="Back to dashboard">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-primary-foreground">Invite &amp; Earn</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 mt-6 space-y-4">
        <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
          <p className="text-sm text-muted-foreground">Your referral code</p>
          <p className="text-2xl font-bold tracking-widest text-foreground mt-1">{code || "—"}</p>

          <p className="text-sm text-muted-foreground mt-4 mb-2">Your invite link</p>
          <div className="flex gap-2">
            <Input readOnly value={link} className="text-xs" onFocus={(e) => e.currentTarget.select()} />
            <Button size="icon" variant="secondary" onClick={copy} aria-label="Copy referral link">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <Button className="w-full mt-3" onClick={share}>
            <Share2 className="w-4 h-4 mr-2" /> Share invite link
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <Users className="w-5 h-5 text-primary mb-2" />
            <p className="text-xl font-bold text-foreground">{rows.length}</p>
            <p className="text-xs text-muted-foreground">People invited</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <Gift className="w-5 h-5 text-primary mb-2" />
            <p className="text-xl font-bold text-foreground">₦{earned.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Bonus earned</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border">
          <h2 className="font-semibold text-foreground mb-3">How it works</h2>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Share your link with friends and family.</li>
            <li>They sign up with your link and verify their account.</li>
            <li>Your bonus is credited once their referral qualifies.</li>
          </ol>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border">
          <h2 className="font-semibold text-foreground mb-3">Your referrals</h2>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referrals yet. Share your link to get started.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.id} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-sm font-medium text-foreground capitalize">{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
};

export default Referrals;
