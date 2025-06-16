// Model capability flags
export interface ModelCapabilities {
  vision?: boolean;
  web?: boolean;
  documents?: boolean;
  reasoning?: boolean;
  coding?: boolean;
}

// Model type definitions
export interface ModelInfo {
  name: string;
  id: string;
  icon: string;
  provider: string;
  capabilities?: ModelCapabilities;
  premium?: boolean;
}

export type ModelId = 
  | "gpt-4o" 
  | "gpt-4o-mini" 
  | "gemini-2.5-flash-preview-04-17"
  | "gemini-2.5-pro-exp-03-25"
  | "claude-4-sonnet-20250514"
  | "claude-3-7-sonnet-20250219"
  | "claude-3-5-sonnet-20241022"
  | "deepseek-chat"
  | "deepseek-reasoner";

// Model configuration
export const models: ModelInfo[] = [
  { 
    id: 'gemini-2.5-flash-preview-04-17', 
    name: 'Gemini 2.5 Flash', 
    icon: 'gemini',
    provider: 'Google',
    capabilities: { vision: true, web: true, documents: true }
  },
  { 
    id: 'gemini-2.5-pro-exp-03-25', 
    name: 'Gemini 2.5 Pro', 
    icon: 'gemini',
    provider: 'Google',
    capabilities: { vision: true, web: true, documents: true, reasoning: true },
    premium: true
  },
  { 
    id: 'gpt-4o', 
    name: 'GPT-4o', 
    icon: 'openai',
    provider: 'OpenAI',
    capabilities: { vision: true, documents: true, coding: true }
  },
  { 
    id: 'gpt-4o-mini', 
    name: 'GPT-4o Mini', 
    icon: 'openai',
    provider: 'OpenAI',
    capabilities: { vision: true, coding: true }
  },
  { 
    id: 'claude-4-sonnet-20250514', 
    name: 'Claude 4 Sonnet', 
    icon: 'claude',
    provider: 'Anthropic',
    capabilities: { vision: true, documents: true, coding: true },
    premium: true
  },
  { 
    id: 'claude-3-7-sonnet-20250219', 
    name: 'Claude 3.7 Sonnet', 
    icon: 'claude',
    provider: 'Anthropic',
    capabilities: { vision: true, documents: true, coding: true },
    premium: true
  },
  { 
    id: 'claude-3-5-sonnet-20241022', 
    name: 'Claude 3.5 Sonnet', 
    icon: 'claude',
    provider: 'Anthropic',
    capabilities: { vision: true, documents: true, coding: true },
    premium: true
  },
  { 
    id: 'deepseek-chat', 
    name: 'DeepSeek Chat', 
    icon: 'deepseek',
    provider: 'DeepSeek',
    capabilities: { coding: true }
  },
  { 
    id: 'deepseek-reasoner', 
    name: 'DeepSeek Reasoner', 
    icon: 'deepseek',
    provider: 'DeepSeek',
    capabilities: { reasoning: true, coding: true }
  }
];

// Default model to use
export const defaultModel: ModelId = "gpt-4o-mini"; 