import { NextRequest } from "next/server";
import { AuthenticatedEdgeRequest } from "@/lib/AuthenticatedEdgeRequest";
import { streamText } from "ai";
import { defaultModel } from "@/lib/config";
import { defaultSystemPrompt, personaPrompts } from "@/lib/prompts";
import { DatabaseService } from "@/lib/database";
import { getModelProvider, isModelSupported } from "@/lib/aiProviders";
import {
  ModelId,
  hasNativeWebSearch,
  getWebSearchApproach,
} from "@/lib/models";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";

export const POST = AuthenticatedEdgeRequest(
  async (req: NextRequest, { userId }: { userId: string }) => {
    try {
      const requestBody = await req.json();
      const {
        messages,
        id,
        model = defaultModel,
        persona = "none",
        data,
        pdfDocs,
      } = requestBody;

      let extractedImageUrl = null;
      let extractedPDFData = null;
      if (messages && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.data) {
          if (lastMessage.data.imageUrl) {
            extractedImageUrl = lastMessage.data.imageUrl;
          }
          if (lastMessage.data.pdfUrl) {
            extractedPDFData = {
              url: lastMessage.data.pdfUrl,
              filename: lastMessage.data.pdfFilename
            };
          }
        }
      }

      console.log(`[DEBUG FROM ROUTE] data:`, requestBody.data);
      console.log(`[DEBUG FROM ROUTE] extractedImageUrl:`, extractedImageUrl);
      console.log(`[DEBUG FROM ROUTE] extractedPDFData:`, extractedPDFData);

      console.log(
        `Chat API called with model: ${model}, chat ID: ${id}, persona: ${persona}`,
      );

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

      if (!id) {
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

      if (!isModelSupported(model)) {
        console.warn(
          `Unsupported model: ${model}, falling back to default: ${defaultModel}`,
        );
      }

      const modelId = isModelSupported(model) ? model : defaultModel;

      let aiModel;
      try {
        aiModel = await getModelProvider(modelId as ModelId);
      } catch (modelError) {
        console.error(
          `Error getting model provider for ${modelId}:`,
          modelError,
        );
        return new Response(
          JSON.stringify({
            error: "Model configuration error",
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const systemPrompt =
        persona !== "none" && persona in personaPrompts
          ? defaultSystemPrompt +
            "\n\n" +
            personaPrompts[persona as keyof typeof personaPrompts].prompt
          : defaultSystemPrompt;

      const webSearchApproach = getWebSearchApproach(modelId);
      console.log(
        `[Chat API] Using ${webSearchApproach} web search approach for model: ${modelId}`,
      );

      const webSearchInstructions = `
**Web Search Capabilities:**
You have access to web search functionality to provide up-to-date information. Use web search when:
- Users ask about current events, news, or recent developments
- Questions require real-time or time-sensitive information
- Users ask about specific facts, statistics, or data that may have changed
- Topics require the latest information that might not be in your training data
- Users explicitly ask you to search for something

When using web search, provide the search results in a clear, organized manner and cite your sources when possible.
`;

      const finalSystemPrompt =
        webSearchApproach === "native"
          ? systemPrompt + "\n\n" + webSearchInstructions
          : systemPrompt;

      let pdfContext = "";
      if (pdfDocs && Array.isArray(pdfDocs) && pdfDocs.length > 0) {
        pdfContext = pdfDocs.map((doc, i) => `Page ${i + 1}:\n${doc.pageContent}`).join("\n\n");
      }
      let finalSystemPromptWithContext = finalSystemPrompt;
      if (pdfContext) {
        finalSystemPromptWithContext = `${finalSystemPrompt}\n\nPDF Content:\n${pdfContext}`;
      }

      const dbOperations = (async () => {
        try {
          const conversation = await DatabaseService.getConversation(id);
          if (!conversation) {
            console.log(`[Chat API] Creating new conversation ${id}`);
            await DatabaseService.createConversation(userId, id);
          }

          const lastUserMessage = messages[messages.length - 1];
          if (lastUserMessage && lastUserMessage.role === "user") {
            // Extract attachments from the message or request data
            let attachments: Array<{ type: string; url: string; filename?: string }> | undefined;
            let messageContent = lastUserMessage.content;
            
            if (data?.imageUrl || extractedImageUrl) {
              // Single image from request data or extracted from message
              const imageUrl = data?.imageUrl || extractedImageUrl;
              attachments = [{
                type: "image",
                url: imageUrl,
                filename: imageUrl.split("/").pop()?.split("?")[0] || "image"
              }];
            } else if (extractedPDFData) {
              attachments = [{
                type: "pdf",
                url: extractedPDFData.url,
                filename: extractedPDFData.filename || extractedPDFData.url.split("/").pop()?.split("?")[0] || "document.pdf"
              }];
            } else if (lastUserMessage.content && typeof lastUserMessage.content === "object" && Array.isArray(lastUserMessage.content)) {
              // Multimodal message with attachments
              const textItems = lastUserMessage.content.filter((item: any) => item.type === "text");
              messageContent = textItems.map((item: any) => item.text).join(" ");
              
              attachments = lastUserMessage.content
                .filter((item: any) => item.type === "image")
                .map((item: any) => ({
                  type: "image",
                  url: item.image.toString(),
                  filename: item.image.toString().split("/").pop()?.split("?")[0] || "image"
                }));
            }

            await DatabaseService.addMessage(id, messageContent, true, undefined, undefined, attachments);
            console.log(`[Chat API] Saved user message to conversation ${id}${attachments ? ` with ${attachments.length} attachment(s)` : ""}`);
          }
        } catch (dbError) {
          console.error(
            `[Chat API] Error with database operations for chat ${id}:`,
            dbError,
          );
        }
      })();

      await dbOperations;

      let processedMessages = messages;
      if (data?.imageUrl || extractedImageUrl) {
        const imageUrl = data?.imageUrl || extractedImageUrl;
        const lastMessageIndex = messages.length - 1;
        const lastMessage = messages[lastMessageIndex];

        if (lastMessage && lastMessage.role === "user") {
          processedMessages = [
            ...messages.slice(0, lastMessageIndex),
            {
              role: "user",
              content: [
                { type: "text", text: lastMessage.content },
                { type: "image", image: new URL(imageUrl) },
              ],
            },
          ];
        }
      }

      let finalModel = aiModel;
      let tools = undefined;

      if (webSearchApproach === "native") {
        if (modelId.startsWith("gemini-")) {
          finalModel = google(modelId, {
            useSearchGrounding: true,
          });
          console.log(
            `[Chat API] Enabled native web search for Gemini model: ${modelId}`,
          );
        } else if (modelId.startsWith("gpt-4o")) {
          tools = {
            web_search_preview: openai.tools.webSearchPreview(),
          };
          console.log(
            `[Chat API] Enabled native web search for OpenAI model: ${modelId}`,
          );
        }
      } else {
        console.log(`[Chat API] No web search available for model: ${modelId}`);
      }

      const result = streamText({
        model: finalModel,
        messages: processedMessages,
        system: finalSystemPromptWithContext,
        tools,
        maxSteps: tools ? 3 : 1,
        onFinish: async ({ text, finishReason, usage, toolResults }) => {
          console.log(
            `[Chat API] Conversation finished for chat ${id}. Reason: ${finishReason}`,
          );
          console.log(
            `[Chat API] Used ${usage.promptTokens} prompt tokens and ${usage.completionTokens} completion tokens for chat ${id}`,
          );

          try {
            await DatabaseService.addMessage(
              id,
              text,
              false,
              {
                promptTokens: usage.promptTokens,
                completionTokens: usage.completionTokens,
              },
              modelId,
            );
            console.log(
              `[Chat API] Saved AI response to conversation ${id} with token usage and model ${modelId}`,
            );
          } catch (dbError) {
            console.error(
              `[Chat API] Error saving messages to database:`,
              dbError,
            );
          }
        },
        onError: (error: unknown) => {
          console.error(`[Chat API] Streaming error for chat ${id}:`, error);
          // Note: This error will be handled by the AI SDK's error handling
          // The frontend useChat hook will receive this error
        },
      });

      return result.toDataStreamResponse();
    } catch (error: unknown) {
      console.error("Error in chat API:", error);

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
          error: "Internal server error",
          details:
            process.env.NODE_ENV === "development" ? String(error) : undefined,
        }),
        {
          status: statusCode,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
);
