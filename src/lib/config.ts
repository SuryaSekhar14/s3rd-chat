export const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  console.warn(
    "OpenAI API key not found. Make sure to set OPENAI_API_KEY in your .env.local file.",
  );
}

export const aiSdkRuntime = process.env.AI_SDK_RUNTIME ?? "30";

// Re-export model types and configurations from models.ts
export type { ModelInfo, ModelCapabilities, ModelId } from "@/lib/models";
export { models, defaultModel } from "@/lib/models";

export const toastConfig = {
  defaultIcon: "👋",
  duration: 2000,
  position: "top-center" as const,
};

// UI Configuration
export const uiConfig = {
  maxSidebarChatTitleLength: 15,
  maxHeaderChatTitleLengthDesktop: 40,
  maxHeaderChatTitleLengthMobile: 20,
};

export const chatNameSuggestionModel = "gpt-3.5-turbo";
export const promptEnhancementModel = "gpt-3.5-turbo";
