import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { deepseek } from "@ai-sdk/deepseek";
import { ModelId } from "./models";
import { loadServerAPIKeys, ServerAPIKeyConfig } from "./serverApiKeys";

let cachedAPIKeys: ServerAPIKeyConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000;

export function clearAPIKeyCache() {
  console.log("[DEBUG] Clearing API key cache");
  cachedAPIKeys = null;
  cacheTimestamp = 0;
}

async function getCachedAPIKeys(): Promise<ServerAPIKeyConfig> {
  const now = Date.now();

  if (cachedAPIKeys && now - cacheTimestamp < CACHE_DURATION) {
    console.log("[DEBUG] Returning cached API keys");
    return cachedAPIKeys;
  }

  console.log("[DEBUG] Cache expired or not set, loading fresh keys");
  
  try {
    cachedAPIKeys = await loadServerAPIKeys();
    cacheTimestamp = now;
    console.log("[DEBUG] Cached fresh API keys");
    return cachedAPIKeys;
  } catch (error) {
    console.error("Error loading cached API keys:", error);
    const fallbackKeys = {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      google: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      deepseek: process.env.DEEPSEEK_API_KEY,
    };
    console.log("[DEBUG] Returning fallback env keys");
    return fallbackKeys;
  }
}

/**
 * Maps model IDs to their corresponding AI SDK providers
 */
export async function getModelProvider(modelId: ModelId) {
  try {
    const apiKeys = await getCachedAPIKeys();

    switch (modelId) {
      case "gpt-4o":
      case "gpt-4o-mini":
        const openaiKey = apiKeys.openai;
        if (!openaiKey) {
          console.error("No OpenAI API key found (neither user-provided nor environment variable)");
          throw new Error("OpenAI API key is not configured");
        }
        process.env.OPENAI_API_KEY = openaiKey;
        return openai(modelId);

      case "gemini-2.5-flash-preview-04-17":
      case "gemini-2.5-pro-exp-03-25":
        const googleKey = apiKeys.google;
        if (!googleKey) {
          console.error("No Google API key found, falling back to GPT-4o-mini");
          const fallbackOpenAIKey = apiKeys.openai;
          if (!fallbackOpenAIKey) {
            throw new Error("No API keys available for fallback");
          }
          process.env.OPENAI_API_KEY = fallbackOpenAIKey;
          return openai("gpt-4o-mini");
        }
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = googleKey;
        return google(modelId);

      case "claude-4-sonnet-20250514":
      case "claude-3-7-sonnet-20250219":
      case "claude-3-5-sonnet-20241022":
        const anthropicKey = apiKeys.anthropic;
        if (!anthropicKey) {
          console.error("No Anthropic API key found, falling back to GPT-4o-mini");
          const fallbackOpenAIKey = apiKeys.openai;
          if (!fallbackOpenAIKey) {
            throw new Error("No API keys available for fallback");
          }
          process.env.OPENAI_API_KEY = fallbackOpenAIKey;
          return openai("gpt-4o-mini");
        }
        process.env.ANTHROPIC_API_KEY = anthropicKey;
        return anthropic(modelId);

      case "deepseek-chat":
      case "deepseek-reasoner":
        const deepseekKey = apiKeys.deepseek;
        if (!deepseekKey) {
          console.error("No DeepSeek API key found, falling back to GPT-4o-mini");
          const fallbackOpenAIKey = apiKeys.openai;
          if (!fallbackOpenAIKey) {
            throw new Error("No API keys available for fallback");
          }
          process.env.OPENAI_API_KEY = fallbackOpenAIKey;
          return openai("gpt-4o-mini");
        }
        process.env.DEEPSEEK_API_KEY = deepseekKey;
        return deepseek(modelId);

      default:
        console.warn(`Unknown model ${modelId}, falling back to GPT-4o-mini`);
        const fallbackOpenAIKey = apiKeys.openai;
        if (!fallbackOpenAIKey) {
          throw new Error("No OpenAI API key available for fallback");
        }
        process.env.OPENAI_API_KEY = fallbackOpenAIKey;
        return openai("gpt-4o-mini");
    }
  } catch (error) {
    console.error(`Error initializing model provider for ${modelId}:`, error);
    const fallbackOpenAIKey = process.env.OPENAI_API_KEY;
    if (!fallbackOpenAIKey) {
      throw new Error("No API keys available for any provider");
    }
    return openai("gpt-4o-mini");
  }
}

/**
 * Validates if a model ID is supported
 */
export function isModelSupported(modelId: string): modelId is ModelId {
  const supportedModels: ModelId[] = [
    "gpt-4o",
    "gpt-4o-mini",
    "gemini-2.5-flash-preview-04-17",
    "gemini-2.5-pro-exp-03-25",
    "claude-4-sonnet-20250514",
    "claude-3-7-sonnet-20250219",
    "claude-3-5-sonnet-20241022",
    "deepseek-chat",
    "deepseek-reasoner",
  ];

  return supportedModels.includes(modelId as ModelId);
}

/**
 * Gets the provider name for a given model ID
 */
export function getProviderName(modelId: ModelId): string {
  switch (modelId) {
    case "gpt-4o":
    case "gpt-4o-mini":
      return "OpenAI";
    case "gemini-2.5-flash-preview-04-17":
    case "gemini-2.5-pro-exp-03-25":
      return "Google";
    case "claude-4-sonnet-20250514":
    case "claude-3-7-sonnet-20250219":
    case "claude-3-5-sonnet-20241022":
      return "Anthropic";
    case "deepseek-chat":
    case "deepseek-reasoner":
      return "DeepSeek";
    default:
      return "Unknown";
  }
}

export async function hasValidAPIKey(provider: string): Promise<boolean> {
  try {
    const apiKeys = await getCachedAPIKeys();
    const key = apiKeys[provider as keyof ServerAPIKeyConfig];
    return !!key && key.trim().length > 0;
  } catch (error) {
    console.error(`Error checking API key for ${provider}:`, error);
    return false;
  }
}
