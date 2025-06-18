import { makeAutoObservable } from "mobx";
import { ChatMessageModel, ChatMessageJSON } from "@/models/ChatMessageModel";

// Interface for serialized ChatModel
interface ChatModelJSON {
  id: string;
  title: string;
  messages: ChatMessageJSON[];
  active: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  persona: string;
}

export class ChatModel {
  id: string;
  title: string;
  messages: ChatMessageModel[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  persona: string;

  private nextMessageId: number = 0;

  constructor(
    id: string,
    title: string,
    messages: ChatMessageModel[] = [],
    active: boolean = false,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    persona: string = "default",
  ) {
    this.id = id;
    this.title = title;
    this.messages = messages;
    this.active = active;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.persona = persona;

    // Initialize nextMessageId based on existing messages
    if (messages.length > 0) {
      this.nextMessageId = Math.max(...messages.map((m) => m.id)) + 1;
    }

    // Make this object and its properties observable
    makeAutoObservable(this);
  }

  // Add a message with content
  addMessage(content: string, isUser: boolean): ChatMessageModel {
    const message = isUser
      ? ChatMessageModel.createUserMessage(this.nextMessageId, content)
      : ChatMessageModel.createAssistantMessage(this.nextMessageId, content);

    this.messages.push(message);
    this.nextMessageId++;
    this.updatedAt = new Date();

    return message;
  }

  // Update title and set updated time
  updateTitle(newTitle: string): void {
    this.title = newTitle;
    this.updatedAt = new Date();
  }

  // Update persona
  updatePersona(newPersona: string): void {
    this.persona = newPersona;
    this.updatedAt = new Date();
  }

  // Update active status without changing updatedAt
  setActive(isActive: boolean): void {
    this.active = isActive;
    // Intentionally not updating this.updatedAt to prevent reordering
  }

  // Preserve an existing timestamp (useful when loading from storage)
  preserveTimestamp(timestamp: Date): void {
    this.updatedAt = timestamp;
  }

  // Replace all messages with a new set (used for syncing from database)
  replaceAllMessages(
    messages: { id: number; content: string; isUser: boolean }[],
  ): void {
    // Convert plain objects to ChatMessageModel instances
    this.messages = messages.map((msg) =>
      msg.isUser
        ? ChatMessageModel.createUserMessage(msg.id, msg.content)
        : ChatMessageModel.createAssistantMessage(msg.id, msg.content),
    );

    // Update nextMessageId to be one more than the highest ID
    if (messages.length > 0) {
      this.nextMessageId = Math.max(...messages.map((m) => m.id)) + 1;
    } else {
      this.nextMessageId = 0;
    }

    // Don't update updatedAt here since this is used for syncing from database,
    // not for making changes that should affect the timestamp
  }

  // Get chat statistics
  getStats() {
    return {
      messageCount: this.messages.length,
      userMessageCount: this.messages.filter((m) => m.isUser).length,
      assistantMessageCount: this.messages.filter((m) => !m.isUser).length,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Serialization for storage
  toJSON(): object {
    return {
      id: this.id,
      title: this.title,
      messages: this.messages,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      persona: this.persona,
    };
  }

  // Create from plain object (deserialization)
  static fromJSON(json: ChatModelJSON): ChatModel {
    return new ChatModel(
      json.id,
      json.title,
      json.messages.map((msg: ChatMessageJSON) =>
        ChatMessageModel.fromJSON(msg),
      ),
      json.active,
      new Date(json.createdAt),
      new Date(json.updatedAt),
      json.persona ?? "default",
    );
  }
}
