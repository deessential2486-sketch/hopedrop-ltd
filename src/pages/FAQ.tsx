import { useNavigate } from "@/lib/router-compat";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "What is Hope Drop?", a: "Hope Drop is a digital payment platform that allows you to manage your funds, buy airtime, data, and more." },
  { q: "How do I activate my HD CODE?", a: "Go to the Activate HD CODE page, make the ₦10,000 payment, upload your proof, and wait for admin approval." },
  { q: "How long does HD CODE activation take?", a: "HD CODE activation is typically reviewed within 24 hours after payment proof is submitted." },
  { q: "How do I withdraw funds?", a: "Navigate to the Withdraw page from your dashboard. You must have an activated HD CODE to withdraw." },
  { q: "Is my money safe?", a: "Yes, Hope Drop uses secure cloud infrastructure to protect your account and funds." },
  { q: "How do I contact support?", a: "Visit the Support page from your dashboard to reach our customer service team." },
];

const FAQ = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="hero-gradient px-4 pt-6 pb-10">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate("/dashboard")} className="text-primary-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <HelpCircle className="w-5 h-5 text-primary-foreground" />
            <span className="text-lg font-bold text-primary-foreground">FAQ</span>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 -mt-4">
        <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-sm text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
