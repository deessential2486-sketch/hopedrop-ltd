import { createFileRoute } from "@tanstack/react-router";
import Terms from "@/pages/Terms";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () =>
    pageHead(
      "Hope Drop NG Terms & Conditions",
      "Read the Hope Drop NG terms covering accounts, HD CODE activation, withdrawals, verification, referrals and acceptable use.",
    ),
  component: Terms,
});
