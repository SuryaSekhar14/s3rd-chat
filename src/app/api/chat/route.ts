import { NextRequest } from "next/server";
import { AuthenticatedEdgeRequest } from "@/lib/AuthenticatedEdgeRequest";
import { streamText } from "ai";
import { defaultModel } from "@/lib/config";
import { defaultSystemPrompt, personaPrompts } from "@/lib/prompts";
import { DatabaseService } from "@/lib/database";
import { getModelProvider, isModelSupported } from "@/lib/aiProviders";
import { ModelId } from "@/lib/models";

export const POST = AuthenticatedEdgeRequest(async (req: NextRequest, { userId }: { userId: string }) => {
  try {
    const requestBody = await req.json();
    const { messages, id, model = defaultModel, persona = "none" } = requestBody;

    console.log(`Chat API called with model: ${model}, chat ID: ${id}, persona: ${persona}`);

    // Validate inputs
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ 
        error: "No messages provided"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!id) {
      return new Response(JSON.stringify({ 
        error: "Chat ID is required"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate the model
    if (!isModelSupported(model)) {
      console.warn(`Unsupported model: ${model}, falling back to default: ${defaultModel}`);
    }

    const modelId = isModelSupported(model) ? model : defaultModel;
    
    let aiModel;
    try {
      aiModel = getModelProvider(modelId as ModelId);
    } catch (modelError) {
      console.error(`Error getting model provider for ${modelId}:`, modelError);
      return new Response(JSON.stringify({ 
        error: "Model configuration error"
      }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const systemPrompt = (persona !== "none" && persona in personaPrompts)
      ? defaultSystemPrompt + "\n\n" + personaPrompts[persona as keyof typeof personaPrompts].prompt
      : defaultSystemPrompt;

    // Handle database operations in parallel without blocking streaming
    const dbOperations = (async () => {
      try {
        // Ensure conversation exists
        const conversation = await DatabaseService.getConversation(id);
        if (!conversation) {
          console.log(`[Chat API] Creating new conversation ${id}`);
          await DatabaseService.createConversation(userId, id);
        }

        // Save the user's message if it's not already in the database
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage && lastUserMessage.role === 'user') {
          await DatabaseService.addMessage(id, lastUserMessage.content, true);
          console.log(`[Chat API] Saved user message to conversation ${id}`);
        }
      } catch (dbError) {
        console.error(`[Chat API] Error with database operations for chat ${id}:`, dbError);
        // Don't fail the request for database errors, just log them
      }
    })();

    await dbOperations;

    // Start streaming immediately while handling database operations in parallel
    const result = streamText({
      model: aiModel,
      messages,
      system: systemPrompt,
      onFinish: async ({ text, finishReason, usage }) => {
        console.log(`[Chat API] Conversation finished for chat ${id}. Reason: ${finishReason}`);
        console.log(`[Chat API] Used ${usage.promptTokens} prompt tokens and ${usage.completionTokens} completion tokens for chat ${id}`);

        try {
          // Save the AI's response
          await DatabaseService.addMessage(id, text, false, {
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens
          }, modelId);
          console.log(`[Chat API] Saved AI response to conversation ${id} with token usage and model ${modelId}`);
        } catch (dbError) {
          console.error(`[Chat API] Error saving messages to database:`, dbError);
        }
      },
      onError: (error: unknown) => {
        console.error(`[Chat API] Streaming error for chat ${id}:`, error);
        // Note: This error will be handled by the AI SDK's error handling
        // The frontend useChat hook will receive this error
      }
    });

    return result.toDataStreamResponse();
  } catch (error: unknown) {
    console.error("Error in chat API:", error);
    
    // Return appropriate status codes - let frontend handle user messages based on status
    let statusCode = 500;
    
    if (error instanceof Error) {
      // Map specific error types to status codes
      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        statusCode = 429;
      } else if (error.message.includes('timeout')) {
        statusCode = 408;
      } else if (error.message.includes('unauthorized') || error.message.includes('API key')) {
        statusCode = 401;
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        statusCode = 503;
      }
    }
    
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
});