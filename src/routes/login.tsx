import { createFileRoute } from "@tanstack/react-router";
import Login from "@/pages/Login";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/login")({
  head: () => pageHead("Sign In to Hope Drop NG", "Log in to your Hope Drop NG account to check your balance, buy airtime and data, and withdraw funds."),
  component: Login,
});
