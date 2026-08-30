import { createFileRoute } from "@tanstack/react-router";
import FAQ from "@/pages/FAQ";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/faq")({
  head: () => pageHead("Hope Drop NG FAQ", "Answers to common questions about Hope Drop NG activation, withdrawals, verification and rewards."),
  component: FAQ,
});
