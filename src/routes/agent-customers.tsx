import { createFileRoute } from "@tanstack/react-router";
import AgentCustomers from "@/pages/AgentCustomers";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/agent-customers")({
  head: () =>
    pageHead(
      "Hope Drop NG Customer Accounts",
      "Agent-only area to review, block or delete Hope Drop NG customer accounts.",
    ),
  component: AgentCustomers,
});
