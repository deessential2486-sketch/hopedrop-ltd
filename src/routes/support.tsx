import { createFileRoute } from "@tanstack/react-router";
import Support from "@/pages/Support";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/support")({
  head: () => pageHead("Hope Drop NG Support", "Reach the Hope Drop NG support team for help with your account, payments or withdrawals."),
  component: Support,
});
