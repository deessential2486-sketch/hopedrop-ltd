import { createFileRoute } from "@tanstack/react-router";
import AgentInbox from "@/pages/AgentInbox";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/agent-inbox")({
  head: () => pageHead("Hope Drop NG Agent Inbox", "Support agent inbox for answering Hope Drop NG customer live chats."),
  component: AgentInbox,
});
