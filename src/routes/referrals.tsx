import { createFileRoute } from "@tanstack/react-router";
import Referrals from "@/pages/Referrals";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/referrals")({
  head: () => pageHead("Invite Friends & Earn on Hope Drop NG", "Share your personal Hope Drop NG referral link, track your invites and earn bonus rewards when friends join and verify."),
  component: Referrals,
});
