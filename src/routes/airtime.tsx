import { createFileRoute } from "@tanstack/react-router";
import Airtime from "@/pages/Airtime";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/airtime")({
  head: () => pageHead("Buy Airtime - Hope Drop NG", "Top up MTN, Airtel, Glo and 9mobile airtime instantly from your Hope Drop NG balance."),
  component: Airtime,
});
