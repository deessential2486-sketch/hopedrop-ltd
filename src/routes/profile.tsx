import { createFileRoute } from "@tanstack/react-router";
import Profile from "@/pages/Profile";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/profile")({
  head: () => pageHead("Your Hope Drop NG Profile", "Manage your Hope Drop NG profile details, verification level and account settings."),
  component: Profile,
});
