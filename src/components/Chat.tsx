"use client";

import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { usePathname } from "next/navigation";

import { MessageList } from "@/components/MessageList";
import { ChatInput } from "@/components/ChatInput";
import { Loading } from "@/components/Loading";
import { Welcome } from "@/components/Welcome";

import { useChatViewModel, useSidebarViewModel } from "@/hooks/useViewModel";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useChat } from "@ai-sdk/react";
import { ApiMessage } from "@/lib/types";
import showToast from "@/lib/toast";

export const Chat = observer(function Chat() {
  const chatViewModel = useChatViewModel();
  const sidebarViewModel = useSidebarViewModel();
  const pathname = usePathname();

  const activeChat = chatViewModel.activeChat;
  const selectedPersona = chatViewModel.selectedPersona;
  const isGenerating = chatViewModel.generating;

  // Track previous chatId to detect changes
  const [prevChatId, setPrevChatId] = React.useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = React.useState<string | null>(
    null,
  );

  const chatId = activeChat?.id;

  // Get initial messages from the view model when loading a chat
  const initialMessages = useMemo(() => {
    return activeChat ? chatViewModel.getAIMessagesFromActiveChat() : [];
  }, [activeChat, chatViewModel]);

  // Navigation logic for chat routes is now handled in the page component

  const { messages, append, status, setInput, input, stop, setMessages } =
    useChat({
      api: "/api/chat",
      id: chatId ?? undefined,
      initialMessages,
      streamProtocol: "data",
      body: {
        model: chatViewModel.getModelFromLocalStorage(),
        persona: selectedPersona,
        id: chatId, // Pass chatId in body as our API expects it
        data: currentImageUrl ? { imageUrl: currentImageUrl } : undefined,
      },
      onFinish: async (message) => {
        // Make sure we have an active chat
        if (activeChat && message.role === "assistant") {
          // On assistant message completion, save all messages to localStorage
          // await chatViewModel.saveMessagesToStorage(messages as ApiMessage[]);

          // Revalidate the sidebar to reflect the updated chat order
          // (the database updatedAt timestamp was updated by the chat API)
          sidebarViewModel.revalidateChatSummaries();

          // If this is the first AI response in a new chat, generate a title
          if (messages.length === 2 && activeChat.title === "New Chat") {
            chatViewModel.startGeneratingTitle();
          }
        }
      },
      onError: (error) => {
        console.error("[Chat] useChat error:", error);

        // Use status code to determine error type - much simpler and more reliable
        let errorMessage = "Failed to send message. Please try again.";

        // Check if error has status code information
        const statusCode = (error as any)?.statusCode || (error as any)?.status;

        switch (statusCode) {
          case 400:
            errorMessage =
              "Invalid request. Please check your message and try again.";
            break;
          case 401:
            errorMessage =
              "Authentication error. Please refresh the page and try again.";
            break;
          case 408:
            errorMessage = "Request timed out. Please try again.";
            break;
          case 429:
            errorMessage =
              "The AI service is currently experiencing high demand. Please wait a moment and try again.";
            break;
          case 503:
            errorMessage =
              "The AI service is temporarily unavailable. Please try again later.";
            break;
          case 500:
          default:
            errorMessage =
              "Something went wrong while processing your message. Please try again.";
            break;
        }

        showToast.error(errorMessage);
      },
    });

  // Effect to detect chat changes and reset messages if needed
  useEffect(() => {
    // If chat ID changed, update the previous ID
    if (chatId !== prevChatId) {
      setPrevChatId(chatId ?? null);

      // Make sure the UI messages match what's in the view model
      if (chatId && initialMessages.length === 0) {
        setMessages([]);
      }

      // No longer need pending message logic since we handle it directly
    }
  }, [chatId, prevChatId, initialMessages, setMessages, append]);

  const handleSubmit = async (e: React.FormEvent, imageUrl?: string) => {
    e.preventDefault();

    // Avoid empty submissions
    if (
      (!input.trim() && !imageUrl) ||
      status === "streaming" ||
      status === "submitted"
    )
      return;

    const currentInput = input.trim();

    // If we're on home page with no active chat, create a new chat first
    if (!activeChat && pathname === "/") {
      console.log("[Chat] Creating new chat from home page with first message");
      const result = await sidebarViewModel.createNewChat();

      if (result.success && result.chatId) {
        // Load the new chat directly without navigation for smooth UX
        const success = await chatViewModel.loadSpecificChat(result.chatId);
        if (success) {
          // Update URL without causing navigation using history API
          window.history.replaceState(null, "", `/chat/${result.chatId}`);
          sidebarViewModel.setActiveChatId(result.chatId);

          if (imageUrl) {
            setCurrentImageUrl(imageUrl);
          }

          // Now send the message immediately
          append({
            content: currentInput || "What's on the image?",
            role: "user",
          });

          if (imageUrl) {
            setTimeout(() => {
              setCurrentImageUrl(null);
            }, 100);
          }
        } else {
          showToast.error("Failed to load new chat");
        }
        return;
      } else {
        // Failed to create chat, don't proceed
        showToast.error("Failed to create chat");
        return;
      }
    }

    // Use append to send to the AI - this will display the message in the UI
    append({
      content: currentInput || "What's on the image?",
      role: "user",
    });

    if (imageUrl) {
      setTimeout(() => {
        setCurrentImageUrl(null);
      }, 100);
    }
  };

  useHotkeys({
    input,
    stop,
    setInput,
  });

  // Monitor status changes to update generating state
  useEffect(() => {
    chatViewModel.setIsGenerating(
      status === "streaming" || status === "submitted",
    );

    // Only save messages when they actually change due to new AI responses
    // Don't save when just switching between chats as this updates timestamps unnecessarily
  }, [chatViewModel, status]);

  // Format messages for display
  const displayMessages = useMemo(() => {
    // If we don't have a chat or messages, return empty array
    if (!chatId || !activeChat || messages.length === 0) {
      return [];
    }

    return chatViewModel.formatAIMessages(messages as ApiMessage[]);
  }, [chatId, messages, chatViewModel, activeChat]);

  // Show welcome/empty screen on home page when no active chat (regardless of whether chats exist)
  if (!activeChat && pathname === "/") {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-hidden p-1 md:p-2 flex items-center justify-center">
          <Welcome
            onCreateChat={() => {
              // Just scroll to input area or show a message
              const inputElement = document.querySelector(
                'input[type="text"], textarea',
              ) as HTMLInputElement | HTMLTextAreaElement;
              if (inputElement) {
                inputElement.focus();
              }
            }}
            isCreating={isGenerating}
          />
        </div>

        <ChatInput
          input={input}
          handleSubmit={handleSubmit}
          setInput={setInput}
          stop={stop}
          status={status}
        />
      </div>
    );
  }

  // Show loading if we're in a chat route but no active chat
  if (!activeChat && pathname.startsWith("/chat/")) {
    return <Loading text="Loading chat..." />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-hidden p-1 md:p-2">
        <MessageList
          messages={displayMessages}
          isLoading={status === "submitted"}
          onSendMessage={setInput}
        />
      </div>

      <ChatInput
        input={input}
        handleSubmit={handleSubmit}
        setInput={setInput}
        stop={stop}
        status={status}
      />
    </div>
  );
});
