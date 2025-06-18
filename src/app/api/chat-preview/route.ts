import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { defaultModel } from "@/lib/config";
import { defaultSystemPrompt, personaPrompts } from "@/lib/prompts";
import { getModelProvider, isModelSupported } from "@/lib/aiProviders";
import { ModelId } from "@/lib/models";

const PREVIEW_MESSAGE_LIMIT = 10;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const key = ip;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return "127.0.0.1";
}

export async function GET() {
  return NextResponse.json({ message: "Preview chat API is available" });
}

export async function POST(req: NextRequest) {
  try {
    const clientIP = getClientIP(req);
    
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded", 
          message: "Too many requests. Please try again later or sign in for unlimited access." 
        },
        { status: 429 }
      );
    }

    const requestBody = await req.json();
    const {
      messages,
      model = defaultModel,
      persona = "none",
      messageCount = 0,
    } = requestBody;



    if (messageCount >= PREVIEW_MESSAGE_LIMIT) {
      return NextResponse.json(
        { 
          error: "Preview limit reached", 
          message: `You've reached the ${PREVIEW_MESSAGE_LIMIT} message limit. Please sign in to continue.`,
          requiresAuth: true
        },
        { status: 403 }
      );
    }

    console.log(`Preview Chat API called with model: ${model}, messageCount: ${messageCount}`);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      );
    }

    if (!isModelSupported(model)) {
      console.warn(`Unsupported model: ${model}, falling back to default: ${defaultModel}`);
    }

    const modelId = isModelSupported(model) ? model : defaultModel;

    let aiModel;
    try {
      aiModel = await getModelProvider(modelId as ModelId);
    } catch (modelError) {
      console.error(`Error getting model provider for ${modelId}:`, modelError);
      return NextResponse.json(
        { error: "Model configuration error" },
        { status: 503 }
      );
    }

    const systemPrompt =
      persona !== "none" && persona in personaPrompts
        ? defaultSystemPrompt +
          "\n\n" +
          personaPrompts[persona as keyof typeof personaPrompts].prompt
        : defaultSystemPrompt;

    const previewSystemPrompt = `${systemPrompt}

**Preview Mode Notice:** You are currently in preview mode. The user has ${PREVIEW_MESSAGE_LIMIT - messageCount} messages remaining before they need to sign in. Be helpful and encourage them to sign up for unlimited access to continue the conversation.`;


    const processedMessages = messages;

    const result = streamText({
      model: aiModel,
      messages: processedMessages,
      system: previewSystemPrompt,
      maxSteps: 1,
      onFinish: async ({ text, finishReason, usage }) => {
        console.log(`Preview chat finished. Reason: ${finishReason}, Usage:`, usage);
      },
      onError: (error: unknown) => {
        console.error("Preview chat streaming error:", error);
      },
    });

    const response = result.toDataStreamResponse();
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString());

    return response;
  } catch (error) {
    console.error("Preview chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 