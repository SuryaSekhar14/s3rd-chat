import { useState, useEffect } from "react";

interface PinnedChat {
  id: string;
  title: string;
  pinnedAt: string;
}

const PINNED_CHATS_KEY = "pinnedChats";

export function usePinnedChats() {
  const [pinnedChats, setPinnedChats] = useState<PinnedChat[]>([]);

  // Load pinned chats from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem(PINNED_CHATS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPinnedChats(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error("Error loading pinned chats:", error);
      setPinnedChats([]);
    }
  }, []);

  // Save pinned chats to localStorage whenever they change
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(PINNED_CHATS_KEY, JSON.stringify(pinnedChats));
    } catch (error) {
      console.error("Error saving pinned chats:", error);
    }
  }, [pinnedChats]);

  const pinChat = (chatId: string, title: string) => {
    setPinnedChats((prev) => {
      // Check if already pinned
      if (prev.some((chat) => chat.id === chatId)) {
        return prev;
      }

      const newPinnedChat: PinnedChat = {
        id: chatId,
        title,
        pinnedAt: new Date().toISOString(),
      };

      return [...prev, newPinnedChat];
    });
  };

  const unpinChat = (chatId: string) => {
    setPinnedChats((prev) => prev.filter((chat) => chat.id !== chatId));
  };

  const isPinned = (chatId: string) => {
    return pinnedChats.some((chat) => chat.id === chatId);
  };

  const updatePinnedChatTitle = (chatId: string, newTitle: string) => {
    setPinnedChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, title: newTitle } : chat,
      ),
    );
  };

  return {
    pinnedChats,
    pinChat,
    unpinChat,
    isPinned,
    updatePinnedChatTitle,
  };
}
