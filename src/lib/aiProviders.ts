import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { deepseek } from "@ai-sdk/deepseek";
import { ModelId } from "./models";
import { apiKeyManager, APIKeyConfig } from "./apiKeyManager";

// Cache for API keys to avoid repeated async calls
let cachedAPIKeys: APIKeyConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedAPIKeys(): Promise<APIKeyConfig> {
  const now = Date.now();

  // Return cached keys if they're still valid
  if (cachedAPIKeys && now - cacheTimestamp < CACHE_DURATION) {
    return cachedAPIKeys;
  }

  // Load fresh keys
  try {
    cachedAPIKeys = await apiKeyManager.loadAPIKeys();
    cacheTimestamp = now;
    return cachedAPIKeys;
  } catch (error) {
    console.error("Error loading cached API keys:", error);
    // Return empty object if loading fails
    return {};
  }
}

function getAPIKeySync(provider: keyof APIKeyConfig): string | undefined {
  // For synchronous access, use the sync method or fallback to env
  if (cachedAPIKeys && cachedAPIKeys[provider]) {
    return cachedAPIKeys[provider];
  }

  // Fallback to environment variables
  const envKey = process.env[`${provider.toUpperCase()}_API_KEY`];
  if (envKey) {
    return envKey;
  }

  // Special case for Google
  if (provider === "google" && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  }

  return undefined;
}

/**
 * Maps model IDs to their corresponding AI SDK providers
 */
export async function getModelProvider(modelId: ModelId) {
  try {
    // Load API keys once
    const apiKeys = await getCachedAPIKeys();

    switch (modelId) {
      // OpenAI models
      case "gpt-4o":
      case "gpt-4o-mini":
        const openaiKey = apiKeys.openai || process.env.OPENAI_API_KEY;
        if (!openaiKey) {
          console.error(
            "No OpenAI API key found (neither user-provided nor environment variable)",
          );
          throw new Error("OpenAI API key is not configured");
        }
        if (apiKeys.openai) {
          process.env.OPENAI_API_KEY = openaiKey;
        }
        return openai(modelId);

      // Google/Gemini models
      case "gemini-2.5-flash-preview-04-17":
      case "gemini-2.5-pro-exp-03-25":
        const googleKey =
          apiKeys.google || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!googleKey) {
          console.error(
            "No Google API key found (neither user-provided nor environment variable), falling back to GPT-4o-mini",
          );
          const fallbackOpenAIKey =
            apiKeys.openai || process.env.OPENAI_API_KEY;
          if (!fallbackOpenAIKey) {
            throw new Error("No API keys available for fallback");
          }
          if (apiKeys.openai) {
            process.env.OPENAI_API_KEY = fallbackOpenAIKey;
          }
          return openai("gpt-4o-mini");
        }
        if (apiKeys.google) {
          process.env.GOOGLE_GENERATIVE_AI_API_KEY = googleKey;
        }
        return google(modelId);

      // Anthropic/Claude models
      case "claude-4-sonnet-20250514":
      case "claude-3-7-sonnet-20250219":
      case "claude-3-5-sonnet-20241022":
        const anthropicKey = apiKeys.anthropic || process.env.ANTHROPIC_API_KEY;
        if (!anthropicKey) {
          console.error(
            "No Anthropic API key found (neither user-provided nor environment variable), falling back to GPT-4o-mini",
          );
          const fallbackOpenAIKey =
            apiKeys.openai || process.env.OPENAI_API_KEY;
          if (!fallbackOpenAIKey) {
            throw new Error("No API keys available for fallback");
          }
          if (apiKeys.openai) {
            process.env.OPENAI_API_KEY = fallbackOpenAIKey;
          }
          return openai("gpt-4o-mini");
        }
        if (apiKeys.anthropic) {
          process.env.ANTHROPIC_API_KEY = anthropicKey;
        }
        return anthropic(modelId);

      // DeepSeek models
      case "deepseek-chat":
      case "deepseek-reasoner":
        const deepseekKey = apiKeys.deepseek || process.env.DEEPSEEK_API_KEY;
        if (!deepseekKey) {
          console.error(
            "No DeepSeek API key found (neither user-provided nor environment variable), falling back to GPT-4o-mini",
          );
          const fallbackOpenAIKey =
            apiKeys.openai || process.env.OPENAI_API_KEY;
          if (!fallbackOpenAIKey) {
            throw new Error("No API keys available for fallback");
          }
          if (apiKeys.openai) {
            process.env.OPENAI_API_KEY = fallbackOpenAIKey;
          }
          return openai("gpt-4o-mini");
        }
        if (apiKeys.deepseek) {
          process.env.DEEPSEEK_API_KEY = deepseekKey;
        }
        return deepseek(modelId);

      default:
        // Fallback to GPT-4o-mini for unknown models
        console.warn(`Unknown model ${modelId}, falling back to GPT-4o-mini`);
        const fallbackOpenAIKey = apiKeys.openai || process.env.OPENAI_API_KEY;
        if (!fallbackOpenAIKey) {
          throw new Error("No OpenAI API key available for fallback");
        }
        if (apiKeys.openai) {
          process.env.OPENAI_API_KEY = fallbackOpenAIKey;
        }
        return openai("gpt-4o-mini");
    }
  } catch (error) {
    console.error(`Error initializing model provider for ${modelId}:`, error);
    // Final fallback to GPT-4o-mini
    const fallbackOpenAIKey =
      getAPIKeySync("openai") || process.env.OPENAI_API_KEY;
    if (!fallbackOpenAIKey) {
      throw new Error("No API keys available for any provider");
    }
    if (cachedAPIKeys?.openai) {
      process.env.OPENAI_API_KEY = fallbackOpenAIKey;
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
  const userKey = await apiKeyManager.hasAPIKey(provider as any);
  const envKey =
    !!process.env[`${provider.toUpperCase()}_API_KEY`] ||
    (provider === "google" && !!process.env.GOOGLE_GENERATIVE_AI_API_KEY);

  return userKey || envKey;
}
