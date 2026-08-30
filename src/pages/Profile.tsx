import { useEffect } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, User, Mail, Phone, Shield } from "lucide-react";

const Profile = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const bpcLabel = user.status === "approved" ? "Activated ✅" : user.status === "pending" ? "Under Review ⏳" : user.status === "declined" ? "Declined ❌" : "Not Activated";

  return (
    <div className="min-h-screen bg-background">
      <header className="hero-gradient px-4 py-6">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="text-primary-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-primary-foreground">Profile</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 mt-6 space-y-4">
        <div className="bg-card rounded-2xl p-6 shadow-lg border border-border text-center">
          <div className="w-20 h-20 rounded-full bg-primary mx-auto flex items-center justify-center mb-3">
            <span className="text-2xl font-bold text-primary-foreground">
              {user.fullName.split(" ").map(n => n[0]).join("").toUpperCase()}
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground">{user.fullName}</h2>
          <p className="text-sm text-muted-foreground">Hope Drop Customer</p>
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <h3 className="font-semibold text-foreground mb-4">Candidate Details</h3>
          <div className="space-y-4">
            <DetailRow icon={<User className="w-4 h-4" />} label="Full Name" value={user.fullName} />
            <DetailRow icon={<Mail className="w-4 h-4" />} label="Email" value={user.email} />
            <DetailRow icon={<Phone className="w-4 h-4" />} label="Phone" value={user.phone} />
            <DetailRow icon={<Shield className="w-4 h-4" />} label="HD CODE Status" value={bpcLabel} />
          </div>
        </div>

        <Button variant="destructive" onClick={handleLogout} className="w-full">
          <LogOut className="w-4 h-4 mr-2" /> Log Out
        </Button>
      </div>

      <div className="h-8" />
    </div>
  );
};

const DetailRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-3">
    <div className="text-muted-foreground">{icon}</div>
    <div className="flex-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  </div>
);

export default Profile;
