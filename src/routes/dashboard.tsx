import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/pages/Dashboard";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/dashboard")({
  head: () => pageHead("Your Hope Drop NG Dashboard", "See your Hope Drop NG balance, activation status and quick actions for airtime, data and withdrawals."),
  component: Dashboard,
});
