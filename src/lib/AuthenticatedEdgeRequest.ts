import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export function AuthenticatedEdgeRequest(
  handler: (req: NextRequest, context: { userId: string }) => Promise<Response>,
) {
  return async function wrappedHandler(req: NextRequest): Promise<Response> {
    const { userId } = await auth();

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return handler(req, { userId });
  };
}
