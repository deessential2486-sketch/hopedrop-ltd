import { createFileRoute } from "@tanstack/react-router";
import LiveChat from "@/pages/LiveChat";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/chat")({
  head: () => pageHead("Live Chat with Hope Drop NG Support", "Chat live with a Hope Drop NG support agent about your account, activation or withdrawals."),
  component: LiveChat,
});
