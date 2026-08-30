import { createFileRoute } from "@tanstack/react-router";
import HopeDropLanding from "@/pages/HopeDropLanding";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => pageHead("Hope Drop NG - Instant Airtime, Data & Cash Rewards", "Hope Drop NG helps Nigerians top up airtime and data, verify their identity and withdraw cash rewards in minutes."),
  component: HopeDropLanding,
});
