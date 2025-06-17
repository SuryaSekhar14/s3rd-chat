import { useUser } from "@clerk/nextjs";
import { useCallback } from "react";
import { ChatMessageJSON } from "@/models/ChatMessageModel";
import { useConversationsSWR } from "./useSimpleSWR";

export const useDatabase = () => {
  const { user, isLoaded } = useUser();
  const {
    conversations,
    refresh: refreshConversations,
    mutate,
  } = useConversationsSWR();

  const getChatsFromDatabase = useCallback(async () => {
    if (!user?.id || !isLoaded) return null;

    // Return cached conversations directly from SWR
    return conversations ?? [];
  }, [user?.id, isLoaded, conversations]);

  const createConversationInDatabase = useCallback(
    async (conversationId: string, title?: string) => {
      if (!user?.id || !isLoaded) return false;

      try {
        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId,
            title: title ?? "New Chat",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create conversation");
        }

        const result = await response.json();

        // Optimistically update SWR cache instead of full refresh
        mutate((current: any) => {
          if (!current) return { conversations: [result.conversation] };
          return {
            ...current,
            conversations: [result.conversation, ...current.conversations],
          };
        }, false);

        return true;
      } catch (error) {
        console.error("Error creating conversation in database:", error);
        return false;
      }
    },
    [user?.id, isLoaded, mutate],
  );

  const updateConversationInDatabase = useCallback(
    async (conversationId: string, updates: { title?: string }) => {
      if (!user?.id || !isLoaded) return false;

      try {
        const response = await fetch("/api/conversations", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId,
            ...updates,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update conversation");
        }

        const result = await response.json();

        // Optimistically update SWR cache
        mutate((current: any) => {
          if (!current?.conversations) return current;

          const updatedConversations = current.conversations.map((conv: any) =>
            conv.id === conversationId
              ? { ...conv, ...updates, updatedAt: new Date().toISOString() }
              : conv,
          );

          return {
            ...current,
            conversations: updatedConversations,
          };
        }, false);

        return true;
      } catch (error) {
        console.error("Error updating conversation in database:", error);
        return false;
      }
    },
    [user?.id, isLoaded, mutate],
  );

  const deleteConversationFromDatabase = useCallback(
    async (conversationId: string) => {
      if (!user?.id || !isLoaded) return false;

      try {
        const response = await fetch(
          `/api/conversations?id=${conversationId}`,
          {
            method: "DELETE",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to delete conversation");
        }

        // Optimistically update SWR cache
        mutate((current: any) => {
          if (!current?.conversations) return current;

          const filteredConversations = current.conversations.filter(
            (conv: any) => conv.id !== conversationId,
          );

          return {
            ...current,
            conversations: filteredConversations,
          };
        }, false);

        return true;
      } catch (error) {
        console.error("Error deleting conversation from database:", error);
        return false;
      }
    },
    [user?.id, isLoaded, mutate],
  );

  const saveMessagesToDatabase = useCallback(
    async (conversationId: string, messages: ChatMessageJSON[]) => {
      if (!user?.id || !isLoaded) return false;

      try {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId,
            messages,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save messages");
        }

        // Don't refresh conversations for message saves - it's unnecessary
        return true;
      } catch (error) {
        console.error("Error saving messages to database:", error);
        return false;
      }
    },
    [user?.id, isLoaded],
  );

  const getSpecificConversation = useCallback(
    async (conversationId: string) => {
      if (!user?.id || !isLoaded) return null;

      try {
        const response = await fetch(`/api/conversations/${conversationId}`);

        if (!response.ok) {
          if (response.status === 404) {
            return null; // Conversation doesn't exist
          }
          throw new Error("Failed to fetch conversation");
        }

        const data = await response.json();
        return data.conversation;
      } catch (error) {
        console.error("Error fetching specific conversation:", error);
        return null;
      }
    },
    [user?.id, isLoaded],
  );

  return {
    isUserLoaded: isLoaded,
    userId: user?.id,
    getChatsFromDatabase,
    getSpecificConversation,
    createConversationInDatabase,
    updateConversationInDatabase,
    deleteConversationFromDatabase,
    saveMessagesToDatabase,
    refreshConversations, // Keep for manual refresh when needed
  };
};
