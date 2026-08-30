import { Wallet, ShieldCheck, Phone, Wifi, Zap, ArrowRight } from "lucide-react";
import { Link } from "@/lib/router-compat";

const HopeDropLanding = () => {
  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Hero Section */}
      <section className="bg-[#F5C518] px-5 pt-14 pb-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/40">
            <Wallet className="h-8 w-8 text-[#3B2F0B]" aria-hidden="true" />
          </div>

          <h1 className="text-3xl font-bold leading-tight text-[#3B2F0B] mb-4">
            Hope Drop — your money, moving faster
          </h1>

          <p className="text-[#3B2F0B]/85 text-base leading-relaxed mb-8">
            A simple digital wallet for Nigeria. Hold your balance, activate your HD CODE and withdraw straight to your bank account.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-[#F5C518] font-semibold hover:bg-white transition-colors"
            >
              Create free account
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl border border-[#3B2F0B] px-5 py-3.5 text-[#3B2F0B] font-medium hover:bg-white/40 transition-colors"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-white px-5 py-10">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-border/50">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#FEF9E7] text-[#F5C518]">
              <Wallet className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Instant wallet</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">Track your naira balance in real time.</p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm border border-border/50">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#FEF9E7] text-[#F5C518]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">HD CODE activation</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">Unlock withdrawals with a ₦5,000 or ₦10,000 HD CODE.</p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm border border-border/50">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#FEF9E7] text-[#F5C518]">
              <Phone className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Airtime top-up</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">MTN, Airtel, Glo and 9mobile in one tap.</p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm border border-border/50">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#FEF9E7] text-[#F5C518]">
              <Wifi className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Data bundles</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">Affordable bundles from 1GB to 10GB.</p>
          </div>
        </div>
      </section>

      {/* How withdrawals work */}
      <section className="bg-[#FEF9E7] px-5 py-10">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Zap className="h-5 w-5 text-[#F5C518]" aria-hidden="true" />
            <h2 className="text-lg font-bold text-foreground">How withdrawals work</h2>
          </div>

          <ol className="space-y-4 mb-6">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F5C518] text-xs font-semibold text-[#3B2F0B]">1</span>
              <p className="text-sm text-foreground leading-relaxed">Create your account and check your balance.</p>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F5C518] text-xs font-semibold text-[#3B2F0B]">2</span>
              <p className="text-sm text-foreground leading-relaxed">Pay ₦5,000 (half balance) or ₦10,000 (full balance) for an HD CODE.</p>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F5C518] text-xs font-semibold text-[#3B2F0B]">3</span>
              <p className="text-sm text-foreground leading-relaxed">Upload proof of payment for review.</p>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F5C518] text-xs font-semibold text-[#3B2F0B]">4</span>
              <p className="text-sm text-foreground leading-relaxed">Withdraw to any Nigerian bank account.</p>
            </li>
          </ol>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white px-5 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          Need help?{" "}
          <Link to="/faq" className="text-[#F5C518] hover:underline font-medium">Read the FAQ</Link>
          {" or "}
          <Link to="/support" className="text-[#F5C518] hover:underline font-medium">contact support</Link>
        </p>
      </footer>
    </div>
  );
};

export default HopeDropLanding;
