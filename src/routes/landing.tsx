import { createFileRoute } from "@tanstack/react-router";
import HopeDropLanding from "@/pages/HopeDropLanding";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/landing")({
  head: () => pageHead("Hope Drop NG - Instant Airtime, Data & Cash Rewards", "Discover how Hope Drop NG rewards members with airtime, data bundles and fast cash withdrawals."),
  component: HopeDropLanding,
});
