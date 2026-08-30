import { createFileRoute } from "@tanstack/react-router";
import Withdraw from "@/pages/Withdraw";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/withdraw")({
  head: () => pageHead("Withdraw Funds - Hope Drop NG", "Send your Hope Drop NG balance straight to your Nigerian bank account."),
  component: Withdraw,
});
