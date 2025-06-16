export type MessageRole = 'user' | 'assistant' | 'system';

export interface ApiMessageJSON {
  role: MessageRole;
  content: string;
  id?: string;
}

export class ApiMessageModel {
  id?: string;
  role: MessageRole;
  content: string;

  constructor(role: MessageRole, content: string, id?: string) {
    this.role = role;
    this.content = content;
    this.id = id;
  }

  // Create a user message
  static createUserMessage(content: string, id?: string): ApiMessageModel {
    return new ApiMessageModel('user', content, id);
  }

  // Create an assistant message
  static createAssistantMessage(content: string, id?: string): ApiMessageModel {
    return new ApiMessageModel('assistant', content, id);
  }

  // Create a system message
  static createSystemMessage(content: string, id?: string): ApiMessageModel {
    return new ApiMessageModel('system', content, id);
  }

  // Serialization support
  toJSON(): ApiMessageJSON {
    const result: ApiMessageJSON = {
      role: this.role,
      content: this.content
    };
    
    if (this.id) {
      result.id = this.id;
    }
    
    return result;
  }

  // Create from plain object (deserialization)
  static fromJSON(json: ApiMessageJSON): ApiMessageModel {
    return new ApiMessageModel(
      json.role,
      json.content,
      json.id
    );
  }
} 