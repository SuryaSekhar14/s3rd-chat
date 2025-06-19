import { PrismaClient } from "../generated/prisma";
import { ChatMessageJSON } from "@/models/ChatMessageModel";

// Initialize Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export class DatabaseService {
  /**
   * Get or create a user by Clerk user ID
   */
  static async getOrCreateUser(clerkUserId: string) {
    try {
      let user = await prisma.user.findUnique({
        where: { clerkUserId },
      });

      if (!user) {
        user = await prisma.user.create({
          data: { clerkUserId },
        });
      }

      return user;
    } catch (error) {
      console.error("Error getting or creating user:", error);
      throw error;
    }
  }

  /**
   * Get all conversations for a user - optimized this for the sidebar, taale it will not include all the messages.
   */
  static async getUserConversations(clerkUserId: string) {
    try {
      const user = await this.getOrCreateUser(clerkUserId);

      const conversations = await prisma.conversation.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      return conversations;
    } catch (error) {
      console.error("Error getting user conversations:", error);
      throw error;
    }
  }

  /**
   * Create a new conversation
   */
  static async createConversation(
    clerkUserId: string,
    conversationId: string,
    title = "New Chat",
  ) {
    try {
      const user = await this.getOrCreateUser(clerkUserId);

      const conversation = await prisma.conversation.create({
        data: {
          id: conversationId,
          userId: user.id,
          title,
        },
      });

      return conversation;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  }

  /**
   * Update conversation title
   */
  static async updateConversationTitle(conversationId: string, title: string) {
    try {
      const conversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          title,
        },
      });

      return conversation;
    } catch (error) {
      console.error("Error updating conversation title:", error);
      throw error;
    }
  }

  /**
   * Delete a conversation and all its messages
   */
  static async deleteConversation(conversationId: string) {
    try {
      await prisma.conversation.delete({
        where: { id: conversationId },
      });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
  }

  /**
   * Add a single message to a conversation
   */
  static async addMessage(
    conversationId: string,
    content: string,
    isUser: boolean,
    tokenData?: { promptTokens?: number; completionTokens?: number },
    aiModel?: string,
    attachments?: Array<{ type: string; url: string; filename?: string }>,
  ) {
    try {
      const message = await prisma.message.create({
        data: {
          conversationId,
          content,
          isUser,
          aiModel: isUser ? null : aiModel, // Only set aiModel for AI messages
          promptTokens: tokenData?.promptTokens,
          completionTokens: tokenData?.completionTokens,
          attachments: attachments || undefined,
        },
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return message;
    } catch (error) {
      console.error("Error adding message:", error);
      throw error;
    }
  }

  /**
   * Save messages to a conversation (replaces all messages - legacy method)
   */
  static async saveMessages(
    conversationId: string,
    messages: ChatMessageJSON[],
    clerkUserId?: string,
  ) {
    try {
      // First, ensure the conversation exists
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      // If conversation doesn't exist and we have clerkUserId, create it
      if (!conversation && clerkUserId) {
        await this.createConversation(clerkUserId, conversationId);
      }

      // Delete existing messages for this conversation
      await prisma.message.deleteMany({
        where: { conversationId },
      });

      // Insert new messages
      if (messages.length > 0) {
        await prisma.message.createMany({
          data: messages.map((message, index) => ({
            conversationId,
            content: message.content,
            isUser: message.isUser,
            aiModel: message.isUser ? null : message.aiModel,
            attachments: (message as any).attachments || undefined,
            createdAt: new Date(Date.now() + index), // Ensure proper ordering
          })),
        });

        // Update conversation updatedAt
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });
      }
    } catch (error) {
      console.error("Error saving messages:", error);
      throw error;
    }
  }

  /**
   * Get a specific conversation with messages
   */
  static async getConversation(conversationId: string) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
          user: true,
        },
      });

      return conversation;
    } catch (error) {
      console.error("Error getting conversation:", error);
      throw error;
    }
  }

  /**
   * Get a specific conversation for a user (with messages)
   */
  static async getUserConversation(
    clerkUserId: string,
    conversationId: string,
  ) {
    try {
      const user = await this.getOrCreateUser(clerkUserId);

      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId: user.id,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      return conversation;
    } catch (error) {
      console.error("Error getting user conversation:", error);
      throw error;
    }
  }

  static async deleteAllUserConversations(clerkUserId: string) {
    try {
      const user = await this.getOrCreateUser(clerkUserId);

      await prisma.conversation.deleteMany({
        where: { userId: user.id },
      });

      return true;
    } catch (error) {
      console.error("Error deleting all user conversations:", error);
      throw error;
    }
  }
  
  static async getUserConversationsWithMessages(clerkUserId: string) {
    try {
      const user = await this.getOrCreateUser(clerkUserId);

      const conversations = await prisma.conversation.findMany({
        where: { userId: user.id },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      return conversations;
    } catch (error) {
      console.error("Error getting user conversations with messages:", error);
      throw error;
    }
  }
}
