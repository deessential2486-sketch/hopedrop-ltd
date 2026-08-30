import { createFileRoute } from "@tanstack/react-router";
import KYC from "@/pages/KYC";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/kyc")({
  head: () => pageHead("Identity Verification - Hope Drop NG", "Verify your NIN and BVN to raise your Hope Drop NG account tier and withdrawal limits."),
  component: KYC,
});
