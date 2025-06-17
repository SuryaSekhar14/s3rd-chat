import { NextRequest } from "next/server";
import { AuthenticatedEdgeRequest } from "@/lib/AuthenticatedEdgeRequest";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextResponse } from "next/server";

import { promptEnhancementModel } from "@/lib/config";
import { promptEnhancementPrompt } from "@/lib/prompts";

export const POST = AuthenticatedEdgeRequest(
  async (req: NextRequest, { userId }: { userId: string }) => {
    try {
      const { chatId, prompt } = await req.json();

      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        return NextResponse.json(
          {
            error: "Prompt is required",
          },
          { status: 400 },
        );
      }

      const completion = await generateText({
        model: openai(promptEnhancementModel),
        messages: [
          { role: "system", content: promptEnhancementPrompt },
          { role: "user", content: prompt.trim() },
        ],
      });

      const enhancedPrompt = completion.text.trim();
      console.log(`Enhanced prompt for chat ${chatId}: ${enhancedPrompt}`);

      if (enhancedPrompt === "Cannot") {
        return NextResponse.json(
          {
            error: "Prompt is gibberish",
          },
          { status: 400 },
        );
      }

      return NextResponse.json({
        enhancedPrompt,
      });
    } catch (error: unknown) {
      console.error("Error enhancing prompt:", error);

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

      return NextResponse.json(
        {
          error: "Failed to enhance prompt",
          details:
            process.env.NODE_ENV === "development" ? String(error) : undefined,
        },
        { status: statusCode },
      );
    }
  },
);
