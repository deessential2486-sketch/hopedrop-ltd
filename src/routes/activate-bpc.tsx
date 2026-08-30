import { createFileRoute } from "@tanstack/react-router";
import ActivateBPC from "@/pages/ActivateBPC";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/activate-bpc")({
  head: () => pageHead("Activate Your BPC - Hope Drop NG", "Activate your Hope Drop NG BPC code to unlock withdrawals and full account access."),
  component: ActivateBPC,
});
