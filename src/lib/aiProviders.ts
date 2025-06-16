import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { deepseek } from "@ai-sdk/deepseek";
import { ModelId } from "./models";
import { apiKeyManager } from "./apiKeyManager";

/**
 * Maps model IDs to their corresponding AI SDK providers
 */
export function getModelProvider(modelId: ModelId) {
  try {
    switch (modelId) {
      // OpenAI models
      case "gpt-4o":
      case "gpt-4o-mini":
        const openaiKey = apiKeyManager.getAPIKey('openai') || process.env.OPENAI_API_KEY;
        if (!openaiKey) {
          console.error("No OpenAI API key found (neither user-provided nor environment variable)");
          throw new Error("OpenAI API key is not configured");
        }
        if (apiKeyManager.getAPIKey('openai')) {
          process.env.OPENAI_API_KEY = openaiKey;
        }
        return openai(modelId);
      
      // Google/Gemini models
      case "gemini-2.5-flash-preview-04-17":
      case "gemini-2.5-pro-exp-03-25":
        const googleKey = apiKeyManager.getAPIKey('google') || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!googleKey) {
          console.error("No Google API key found (neither user-provided nor environment variable), falling back to GPT-4o-mini");
          const fallbackOpenAIKey = apiKeyManager.getAPIKey('openai') || process.env.OPENAI_API_KEY;
          if (!fallbackOpenAIKey) {
            throw new Error("No API keys available for fallback");
          }
          if (apiKeyManager.getAPIKey('openai')) {
            process.env.OPENAI_API_KEY = fallbackOpenAIKey;
          }
          return openai("gpt-4o-mini");
        }
        if (apiKeyManager.getAPIKey('google')) {
          process.env.GOOGLE_GENERATIVE_AI_API_KEY = googleKey;
        }
        return google(modelId);
      
      // Anthropic/Claude models
      case "claude-4-sonnet-20250514":
      case "claude-3-7-sonnet-20250219":
      case "claude-3-5-sonnet-20241022":
        const anthropicKey = apiKeyManager.getAPIKey('anthropic') || process.env.ANTHROPIC_API_KEY;
        if (!anthropicKey) {
          console.error("No Anthropic API key found (neither user-provided nor environment variable), falling back to GPT-4o-mini");
          const fallbackOpenAIKey = apiKeyManager.getAPIKey('openai') || process.env.OPENAI_API_KEY;
          if (!fallbackOpenAIKey) {
            throw new Error("No API keys available for fallback");
          }
          if (apiKeyManager.getAPIKey('openai')) {
            process.env.OPENAI_API_KEY = fallbackOpenAIKey;
          }
          return openai("gpt-4o-mini");
        }
        if (apiKeyManager.getAPIKey('anthropic')) {
          process.env.ANTHROPIC_API_KEY = anthropicKey;
        }
        return anthropic(modelId);
      
      // DeepSeek models
      case "deepseek-chat":
      case "deepseek-reasoner":
        const deepseekKey = apiKeyManager.getAPIKey('deepseek') || process.env.DEEPSEEK_API_KEY;
        if (!deepseekKey) {
          console.error("No DeepSeek API key found (neither user-provided nor environment variable), falling back to GPT-4o-mini");
          const fallbackOpenAIKey = apiKeyManager.getAPIKey('openai') || process.env.OPENAI_API_KEY;
          if (!fallbackOpenAIKey) {
            throw new Error("No API keys available for fallback");
          }
          if (apiKeyManager.getAPIKey('openai')) {
            process.env.OPENAI_API_KEY = fallbackOpenAIKey;
          }
          return openai("gpt-4o-mini");
        }
        if (apiKeyManager.getAPIKey('deepseek')) {
          process.env.DEEPSEEK_API_KEY = deepseekKey;
        }
        return deepseek(modelId);
      
      default:
        // Fallback to GPT-4o-mini for unknown models
        console.warn(`Unknown model ${modelId}, falling back to GPT-4o-mini`);
        const fallbackOpenAIKey = apiKeyManager.getAPIKey('openai') || process.env.OPENAI_API_KEY;
        if (!fallbackOpenAIKey) {
          throw new Error("No OpenAI API key available for fallback");
        }
        if (apiKeyManager.getAPIKey('openai')) {
          process.env.OPENAI_API_KEY = fallbackOpenAIKey;
        }
        return openai("gpt-4o-mini");
    }
  } catch (error) {
    console.error(`Error initializing model provider for ${modelId}:`, error);
    // Final fallback to GPT-4o-mini
    const fallbackOpenAIKey = apiKeyManager.getAPIKey('openai') || process.env.OPENAI_API_KEY;
    if (!fallbackOpenAIKey) {
      throw new Error("No API keys available for any provider");
    }
    if (apiKeyManager.getAPIKey('openai')) {
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
    "deepseek-reasoner"
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


export function hasValidAPIKey(provider: string): boolean {
  const userKey = apiKeyManager.hasAPIKey(provider as any);
  const envKey = !!process.env[`${provider.toUpperCase()}_API_KEY`] || 
                 (provider === 'google' && !!process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  
  return userKey || envKey;
} 