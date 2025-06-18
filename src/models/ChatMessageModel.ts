import { makeAutoObservable } from "mobx";

export interface ChatMessageJSON {
  id: number;
  content: string;
  isUser: boolean;
  aiModel?: string; // AI model used to generate this message (null for user messages)
  promptTokens?: number;
  completionTokens?: number;
  attachments?: Array<{ type: string; url: string; filename?: string }>;
}

export class ChatMessageModel {
  id: number;
  content: string;
  isUser: boolean;
  aiModel?: string;
  promptTokens?: number;
  completionTokens?: number;
  attachments?: Array<{ type: string; url: string; filename?: string }>;

  constructor(
    id: number,
    content: string,
    isUser: boolean,
    aiModel?: string,
    promptTokens?: number,
    completionTokens?: number,
    attachments?: Array<{ type: string; url: string; filename?: string }>,
  ) {
    this.id = id;
    this.content = content;
    this.isUser = isUser;
    this.aiModel = aiModel;
    this.promptTokens = promptTokens;
    this.completionTokens = completionTokens;
    this.attachments = attachments;

    // Make this object and its properties observable
    makeAutoObservable(this);
  }

  // Create a user message
  static createUserMessage(id: number, content: string, attachments?: Array<{ type: string; url: string; filename?: string }>): ChatMessageModel {
    return new ChatMessageModel(id, content, true, undefined, undefined, undefined, attachments);
  }

  // Create an assistant message
  static createAssistantMessage(
    id: number,
    content: string,
    aiModel?: string,
    promptTokens?: number,
    completionTokens?: number,
    attachments?: Array<{ type: string; url: string; filename?: string }>,
  ): ChatMessageModel {
    return new ChatMessageModel(
      id,
      content,
      false,
      aiModel,
      promptTokens,
      completionTokens,
      attachments,
    );
  }

  // Convert to API message format
  toApiMessage(): { role: "user" | "assistant"; content: string } {
    return {
      role: this.isUser ? "user" : "assistant",
      content: this.content,
    };
  }

  // Serialization support
  toJSON(): object {
    return {
      id: this.id,
      content: this.content,
      isUser: this.isUser,
      aiModel: this.aiModel,
      promptTokens: this.promptTokens,
      completionTokens: this.completionTokens,
      attachments: this.attachments,
    };
  }

  // Create from plain object (deserialization)
  static fromJSON(json: ChatMessageJSON): ChatMessageModel {
    return new ChatMessageModel(
      json.id,
      json.content,
      json.isUser,
      json.aiModel,
      json.promptTokens,
      json.completionTokens,
      json.attachments,
    );
  }
}
