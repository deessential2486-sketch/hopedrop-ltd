import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "@/lib/router-compat";
import { useEffect, useState } from "react";
import { ArrowLeft, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const networks = ["MTN", "Airtel", "Glo", "9mobile"];
const plans = [
  { label: "1GB - ₦500", value: "1gb-500" },
  { label: "2GB - ₦1,000", value: "2gb-1000" },
  { label: "5GB - ₦2,000", value: "5gb-2000" },
  { label: "10GB - ₦3,500", value: "10gb-3500" },
];

const Data = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [network, setNetwork] = useState("");
  const [phone, setPhone] = useState("");
  const [plan, setPlan] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Loading...</p></div>;
  if (!user) return null;

  const handlePurchase = () => {
    if (!network || !phone || !plan) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    toast({ title: "Coming Soon", description: "Data purchase will be available soon." });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="hero-gradient px-4 pt-6 pb-10">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate("/dashboard")} className="text-primary-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Wifi className="w-5 h-5 text-primary-foreground" />
            <span className="text-lg font-bold text-primary-foreground">Buy Data</span>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 -mt-4">
        <div className="bg-card rounded-2xl p-6 shadow-lg border border-border space-y-4">
          <Select onValueChange={setNetwork}>
            <SelectTrigger><SelectValue placeholder="Select Network" /></SelectTrigger>
            <SelectContent>
              {networks.map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />

          <Select onValueChange={setPlan}>
            <SelectTrigger><SelectValue placeholder="Select Plan" /></SelectTrigger>
            <SelectContent>
              {plans.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handlePurchase} className="w-full rounded-xl">Buy Data</Button>
        </div>
      </div>
    </div>
  );
};

export default Data;
