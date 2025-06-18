import { NextRequest } from "next/server";
import { AuthenticatedEdgeRequest } from "@/lib/AuthenticatedEdgeRequest";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { chatNameSuggestionModel } from "@/lib/config";
import { chatNameSuggestionPrompt } from "@/lib/prompts";

export const POST = AuthenticatedEdgeRequest(
  async (req: NextRequest, { userId }: { userId: string }) => {
    try {
      const { chatId, messages } = await req.json();

      // Validate inputs
      if (!chatId) {
        return new Response(
          JSON.stringify({
            error: "Chat ID is required",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return new Response(
          JSON.stringify({
            error: "No messages provided",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const messagesToSend =
        messages.length > 10
          ? [...messages.slice(0, 3), ...messages.slice(-7)]
          : messages;

      const completion = await generateText({
        model: openai(chatNameSuggestionModel),
        messages: [
          { role: "system", content: chatNameSuggestionPrompt },
          ...messagesToSend,
        ],
      });

      const text = completion.text;
      let suggestedName = text;
      if (text.startsWith("#")) {
        suggestedName = text.replace(/^#+\s*/, "");
      }
      suggestedName = suggestedName.trim();

      console.log(
        `Generated chat name: "${suggestedName}", using: ${chatNameSuggestionModel} for chat: ${chatId}`,
      );

      return new Response(JSON.stringify({ name: suggestedName }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error: unknown) {
      console.error("Error generating chat name:", error);

      // Return appropriate status codes - let frontend handle user messages based on status
      let statusCode = 500;

      if (error instanceof Error) {
        // Map specific error types to status codes
        if (
          error.message.includes("rate limit") ||
          error.message.includes("quota")
        ) {
          statusCode = 429;
        } else if (error.message.includes("timeout")) {
          statusCode = 408;
        } else if (
          error.message.includes("unauthorized") ||
          error.message.includes("API key")
        ) {
          statusCode = 401;
        } else if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          statusCode = 503;
        }
      }

      return new Response(
        JSON.stringify({
          error: "Failed to generate chat name",
          details:
            process.env.NODE_ENV === "development" ? String(error) : undefined,
        }),
        {
          status: statusCode,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
  },
);
