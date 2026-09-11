import { useNavigate } from "@/lib/router-compat";
import { ArrowLeft, FileText } from "lucide-react";

const sections = [
  {
    title: "1. Acceptance of terms",
    body: "By creating a Hope Drop account or using any part of the service, you agree to these Terms and Conditions. If you do not agree, please do not use Hope Drop.",
  },
  {
    title: "2. Eligibility",
    body: "You must be at least 18 years old and a resident of Nigeria with a valid phone number, email address and bank account in your own name. Accounts opened with false information may be suspended.",
  },
  {
    title: "3. Your account",
    body: "You are responsible for keeping your password and HD CODE confidential. Any activity carried out with your login details is treated as your own. Tell us immediately if you suspect someone else has access to your account.",
  },
  {
    title: "4. HD CODE activation",
    body: "Withdrawals require an activated HD CODE. Activation fees (₦5,000 for half balance or ₦10,000 for full balance) are paid through our official payment links only. Proof of payment is reviewed before approval, and approval is at our discretion where payment cannot be confirmed.",
  },
  {
    title: "5. Withdrawals and bank details",
    body: "Withdrawals are paid only to a Nigerian bank account whose name matches your verified account details. We are not responsible for delays or losses caused by incorrect account details supplied by you.",
  },
  {
    title: "6. Verification (KYC)",
    body: "We may ask you to confirm your identity, including a live face scan, before approving activation or withdrawal. We may decline or reverse a transaction where verification fails or fraud is suspected.",
  },
  {
    title: "7. Airtime, data and other purchases",
    body: "Airtime and data purchases are delivered through third-party network providers. Once a top-up is delivered to the number you entered, it cannot be reversed. Please confirm the number before paying.",
  },
  {
    title: "8. Referrals",
    body: "Referral bonuses are for genuine invitations only. Self-referrals, duplicate accounts and any other manipulation will result in forfeiture of bonuses and possible account closure.",
  },
  {
    title: "9. Acceptable use",
    body: "You may not use Hope Drop for fraud, money laundering, or any unlawful activity, and you may not attempt to interfere with, copy or disrupt the platform.",
  },
  {
    title: "10. Suspension and closure",
    body: "We may suspend or close an account that breaches these terms, is linked to suspicious activity, or where we are required to do so by law.",
  },
  {
    title: "11. Service availability",
    body: "We work to keep Hope Drop available at all times, but the service may occasionally be unavailable for maintenance or because of issues with banks, networks or other providers outside our control.",
  },
  {
    title: "12. Privacy",
    body: "We collect and store the information you give us, including identity and payment details, to run your account, meet legal obligations and prevent fraud. We do not sell your personal data.",
  },
  {
    title: "13. Limitation of liability",
    body: "To the fullest extent permitted by law, Hope Drop is not liable for indirect or consequential losses. Our total liability for any claim is limited to the amount held in your Hope Drop wallet at the time of the claim.",
  },
  {
    title: "14. Changes to these terms",
    body: "We may update these terms from time to time. Continued use of Hope Drop after an update means you accept the revised terms.",
  },
  {
    title: "15. Contact",
    body: "For questions about these terms, reach us through the Support page or the live chat in your dashboard.",
  },
];

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="hero-gradient px-4 pt-6 pb-10">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate("/")}
              className="text-primary-foreground"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <FileText className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
            <span className="text-lg font-bold text-primary-foreground">Terms & Conditions</span>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 -mt-4 pb-12">
        <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
          <h1 className="text-xl font-bold text-foreground mb-1">Hope Drop Terms & Conditions</h1>
          <p className="text-xs text-muted-foreground mb-6">Last updated: 11 September 2026</p>

          <div className="space-y-5">
            {sections.map((s) => (
              <section key={s.title}>
                <h2 className="text-sm font-semibold text-foreground mb-1">{s.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
