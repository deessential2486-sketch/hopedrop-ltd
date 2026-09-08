import { createFileRoute } from "@tanstack/react-router";
import AdminLogin from "@/pages/AdminLogin";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/admin-login")({
  head: () => pageHead("Hope Drop NG Support Agent Sign In", "Staff sign in for Hope Drop NG support agents to answer customer live chats."),
  component: AdminLogin,
});
