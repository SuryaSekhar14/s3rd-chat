// Export models for type usage
export { ChatModel } from '@/models/ChatModel';
export { ChatMessageModel } from '@/models/ChatMessageModel';
export { ApiMessageModel } from '@/models/ApiMessageModel';

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: number;
  content: string;
  isUser: boolean;
}

export interface ApiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
} 