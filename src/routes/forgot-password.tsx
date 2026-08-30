import { createFileRoute } from "@tanstack/react-router";
import ForgotPassword from "@/pages/ForgotPassword";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/forgot-password")({
  head: () => pageHead("Reset Your Hope Drop NG Password", "Request a secure password reset link for your Hope Drop NG account."),
  component: ForgotPassword,
});
