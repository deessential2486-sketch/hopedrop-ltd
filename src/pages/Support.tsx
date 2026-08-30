import { useNavigate } from "@/lib/router-compat";
import { ArrowLeft, HeadphonesIcon, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const Support = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="hero-gradient px-4 pt-6 pb-10">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate("/dashboard")} className="text-primary-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <HeadphonesIcon className="w-5 h-5 text-primary-foreground" />
            <span className="text-lg font-bold text-primary-foreground">Support</span>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 -mt-4 space-y-4">
        <div className="bg-card rounded-2xl p-6 shadow-lg border border-border text-center space-y-3">
          <HeadphonesIcon className="w-12 h-12 text-primary mx-auto" />
          <h2 className="text-lg font-bold text-foreground">Need Help?</h2>
          <p className="text-sm text-muted-foreground">Our support team is available 24/7 to assist you with any issues.</p>
        </div>

        <a href="mailto:binaceolivia@gmail.com" className="block">
          <div className="bg-card rounded-2xl p-4 shadow-sm border border-border flex items-center gap-4 hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Email Us</p>
              <p className="text-xs text-muted-foreground">binaceolivia@gmail.com</p>
            </div>
          </div>
        </a>

        <a href="https://wa.me/2348000000000" target="_blank" rel="noopener noreferrer" className="block">
          <div className="bg-card rounded-2xl p-4 shadow-sm border border-border flex items-center gap-4 hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">WhatsApp</p>
              <p className="text-xs text-muted-foreground">Chat with us on WhatsApp</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
};

export default Support;
