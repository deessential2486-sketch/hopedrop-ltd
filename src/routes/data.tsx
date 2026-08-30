import { createFileRoute } from "@tanstack/react-router";
import Data from "@/pages/Data";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/data")({
  head: () => pageHead("Buy Data Bundles - Hope Drop NG", "Purchase affordable data bundles on all Nigerian networks with your Hope Drop NG balance."),
  component: Data,
});
