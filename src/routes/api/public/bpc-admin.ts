import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/bpc-admin")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const action = url.searchParams.get("action") ?? "";
        const id = url.searchParams.get("id") ?? "";
        const token = url.searchParams.get("token") ?? "";

        if (!["approve", "decline"].includes(action) || !id || !token) {
          return new Response("Not found", { status: 404 });
        }

        const { handleAdminDecision } = await import("@/lib/bpc.server");
        return handleAdminDecision(action, id, token);
      },
    },
  },
});
