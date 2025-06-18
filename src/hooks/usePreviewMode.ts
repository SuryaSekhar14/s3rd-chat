"use client";

import { useState, useEffect, useCallback } from "react";

const PREVIEW_MESSAGES_KEY = "preview_message_count";
const PREVIEW_CONVERSATION_KEY = "preview_conversation";
const MAX_PREVIEW_MESSAGES = 10;

interface PreviewConversation {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    content: string;
    isUser: boolean;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

let globalLimitDialogState = {
  showDialog: false,
  listeners: new Set<() => void>(),
};

export function usePreviewMode() {
  const [messageCount, setMessageCount] = useState(0);
  const [conversation, setConversation] = useState<PreviewConversation | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  useEffect(() => {
    const listener = () => {
      setShowLimitDialog(globalLimitDialogState.showDialog);
    };
    
    globalLimitDialogState.listeners.add(listener);
    
    return () => {
      globalLimitDialogState.listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCount = localStorage.getItem(PREVIEW_MESSAGES_KEY);
      const savedConversation = localStorage.getItem(PREVIEW_CONVERSATION_KEY);
      
      setMessageCount(savedCount ? parseInt(savedCount, 10) : 0);
      setConversation(savedConversation ? JSON.parse(savedConversation) : null);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem(PREVIEW_MESSAGES_KEY, messageCount.toString());
    }
  }, [messageCount, isInitialized]);

  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      if (conversation) {
        localStorage.setItem(PREVIEW_CONVERSATION_KEY, JSON.stringify(conversation));
      } else {
        localStorage.removeItem(PREVIEW_CONVERSATION_KEY);
      }
    }
  }, [conversation, isInitialized]);

  const remainingMessages = Math.max(0, MAX_PREVIEW_MESSAGES - messageCount);
  const isLimitReached = messageCount >= MAX_PREVIEW_MESSAGES;

  const canSendMessage = useCallback(() => {
    return messageCount < MAX_PREVIEW_MESSAGES;
  }, [messageCount]);

  const incrementMessageCount = useCallback(() => {
    if (messageCount >= MAX_PREVIEW_MESSAGES) {
      return false;
    }
    
    const newCount = messageCount + 1;
    setMessageCount(newCount);
    
    if (typeof window !== "undefined") {
      localStorage.setItem(PREVIEW_MESSAGES_KEY, newCount.toString());
    }
    
    return true;
  }, [messageCount]);

  const showLimitReachedDialog = useCallback(() => {
    globalLimitDialogState.showDialog = true;
    globalLimitDialogState.listeners.forEach(listener => listener());
  }, []);

  const hideLimitReachedDialog = useCallback(() => {
    globalLimitDialogState.showDialog = false;
    globalLimitDialogState.listeners.forEach(listener => listener());
  }, []);

  const createConversation = useCallback(() => {
    if (conversation) return conversation;

    const newConversation: PreviewConversation = {
      id: "preview-conversation",
      title: "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setConversation(newConversation);
    return newConversation;
  }, [conversation]);

  const addMessage = useCallback((
    content: string, 
    isUser: boolean
  ) => {
    if (!conversation) return false;

    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      isUser,
      timestamp: new Date().toISOString(),
    };

    setConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, message],
      updatedAt: new Date().toISOString(),
    } : null);

    return true;
  }, [conversation]);

  const updateTitle = useCallback((title: string) => {
    if (!conversation) return;

    setConversation(prev => prev ? {
      ...prev,
      title,
      updatedAt: new Date().toISOString(),
    } : null);
  }, [conversation]);



  return {
    messageCount,
    remainingMessages,
    isLimitReached,
    canSendMessage,
    incrementMessageCount,
    conversation,
    createConversation,
    addMessage,
    updateTitle,
    isInitialized,
    showLimitDialog,
    showLimitReachedDialog,
    hideLimitReachedDialog,
  };
} 