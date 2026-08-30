import { createFileRoute } from "@tanstack/react-router";
import Register from "@/pages/Register";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/register")({
  head: () => pageHead("Create Your Hope Drop NG Account", "Register for Hope Drop NG in minutes and start earning rewards, buying data and withdrawing cash."),
  component: Register,
});
