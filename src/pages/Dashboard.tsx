import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "@/lib/router-compat";
import { useEffect } from "react";
import { Wallet, ArrowDownCircle, Shield, User, LogOut, Phone, Wifi, HelpCircle, HeadphonesIcon, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { user, loading, logout, refreshBpcStatus, kyc } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    // Poll BPC status every 30s in case admin approves
    const interval = setInterval(() => {
      refreshBpcStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshBpcStatus]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Loading...</p></div>;
  if (!user) return null;

  const bpcActivated = user.status === "approved";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="hero-gradient px-4 pt-6 pb-20">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-primary-foreground">Hope Drop</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground text-sm">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
          <p className="text-primary-foreground/70 text-sm">Welcome back,</p>
          <h1 className="text-xl font-bold text-primary-foreground">{user.fullName}</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 -mt-14">
        <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
          <h2 className="text-3xl font-bold text-foreground">₦{user.balance.toLocaleString()}.00</h2>
          <p className="text-xs text-muted-foreground mt-1">Nigerian Naira (NGN)</p>

          {kyc.tier < 2 && (
            <div className="mt-4 p-3 rounded-xl bg-secondary border border-primary/20">
              <p className="text-xs text-secondary-foreground">
                {kyc.tier === 0
                  ? "Your account is unverified. Verification is required to access higher account limits and features."
                  : "You are Tier 1 verified. Upgrade to Tier 2 for higher limits."}
              </p>
              <Button size="sm" className="mt-2" onClick={() => navigate("/kyc")}>
                {kyc.tier === 0 ? "Verify Account" : "Upgrade Tier"}
              </Button>
            </div>
          )}

          {!bpcActivated && (
            <div className="mt-4 p-3 rounded-xl bg-secondary border border-primary/20">
              <p className="text-xs text-secondary-foreground">
                ⚠️ HD CODE not activated. Activate to enable withdrawals.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <ActionCard icon={<ArrowDownCircle className="w-6 h-6" />} label="Withdraw" onClick={() => navigate("/withdraw")} />
          <ActionCard icon={<Shield className="w-6 h-6" />} label="Activate HD CODE" onClick={() => navigate("/activate-bpc")} />
          <ActionCard icon={<Phone className="w-6 h-6" />} label="Airtime" onClick={() => navigate("/airtime")} />
          <ActionCard icon={<Wifi className="w-6 h-6" />} label="Data" onClick={() => navigate("/data")} />
          <ActionCard icon={<HelpCircle className="w-6 h-6" />} label="FAQ" onClick={() => navigate("/faq")} />
          <ActionCard icon={<HeadphonesIcon className="w-6 h-6" />} label="Support" onClick={() => navigate("/support")} />
          <ActionCard icon={<ShieldCheck className="w-6 h-6" />} label="Verify Account" onClick={() => navigate("/kyc")} />
          <ActionCard icon={<User className="w-6 h-6" />} label="Profile" onClick={() => navigate("/profile")} />
        </div>

        <div className="mt-6 bg-card rounded-2xl p-5 shadow-sm border border-border">
          <h3 className="font-semibold text-foreground mb-3">Account Status</h3>
          <div className="space-y-3">
            <StatusRow label="Account Type" value="Nigerian (NGN)" />
            <StatusRow label="HD CODE" value={bpcActivated ? "Activated ✅" : user.status === "pending" ? "Under Review ⏳" : user.status === "declined" ? "Declined ❌" : "Not Activated"} />
            <StatusRow label="Account Tier" value={kyc.tier === 2 ? "Tier 2 — BVN Verified" : kyc.tier === 1 ? "Tier 1 — NIN Verified" : "Tier 0 — Unverified"} />
            <StatusRow label="Withdrawal" value={bpcActivated ? "Enabled" : "Locked 🔒"} />
          </div>
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
};

const ActionCard = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
    <div className="text-primary">{icon}</div>
    <span className="text-xs font-medium text-foreground">{label}</span>
  </button>
);

const StatusRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-foreground">{value}</span>
  </div>
);

export default Dashboard;
