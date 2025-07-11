"use client";

import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { usePathname } from "next/navigation";

import { MessageList } from "@/components/MessageList";
import { ChatInput } from "@/components/ChatInput";
import { Loading } from "@/components/Loading";
import { Welcome } from "@/components/Welcome";
import { useUser } from "@clerk/nextjs";

  import { useChatViewModel, useSidebarViewModel } from "@/hooks/useViewModel";
  import { useHotkeys } from "@/hooks/useHotkeys";
  import { useChat } from "@ai-sdk/react";
import { ApiMessage } from "@/lib/types";
import showToast from "@/lib/toast";
import { ChatHeader } from "./ChatHeader";
import { usePreviewMode } from "@/hooks/usePreviewMode";
import { analytics, ANALYTICS_EVENTS, ANALYTICS_PROPERTIES } from "@/lib/analytics";

interface ChatProps {
  isPreviewMode?: boolean;
}

export const Chat = observer(function Chat({ isPreviewMode = false }: ChatProps) {
  const chatViewModel = useChatViewModel();
  const sidebarViewModel = useSidebarViewModel();
  const pathname = usePathname();
  const { user } = useUser();
  const previewMode = usePreviewMode();

  const activeChat = isPreviewMode ? previewMode.conversation : chatViewModel.activeChat;
  const selectedPersona = chatViewModel.selectedPersona;
  const isGenerating = chatViewModel.generating;

  // Track previous chatId to detect changes
  const [prevChatId, setPrevChatId] = React.useState<string | null>(null);
  const [currentPDFData, setCurrentPDFData] = React.useState<{ url: string; filename: string } | null>(
    null,
  );
  const [pdfDocs, setPdfDocs] = React.useState<any[] | null>(null);

  const chatId = activeChat?.id;

  // Get initial messages from the view model when loading a chat
  const initialMessages = useMemo(() => {
    if (isPreviewMode && activeChat) {
      return activeChat.messages.map(msg => ({
        id: msg.id.toString(),
        role: msg.isUser ? "user" as const : "assistant" as const,
        content: msg.content,
      }));
    }
    return activeChat ? chatViewModel.getAIMessagesFromActiveChat() : [];
  }, [activeChat, chatViewModel, isPreviewMode]);

  // Navigation logic for chat routes is now handled in the page component

  const { messages, append, status, setInput, input, stop, setMessages } =
    useChat({
      api: isPreviewMode ? "/api/chat-preview" : "/api/chat",
      id: chatId ?? undefined,
      initialMessages,
      streamProtocol: "data",
      body: {
        model: chatViewModel.getModelFromLocalStorage(),
        persona: selectedPersona,
        id: chatId,
        pdfDocs: pdfDocs ?? undefined,
        messageCount: isPreviewMode ? previewMode.messageCount : undefined,
      },
      onFinish: async (message) => {
        // Track message received
        if (activeChat && message.role === "assistant") {
          analytics.track(ANALYTICS_EVENTS.CHAT_MESSAGE_RECEIVED, {
            [ANALYTICS_PROPERTIES.CHAT_ID]: activeChat.id,
            [ANALYTICS_PROPERTIES.MESSAGE_LENGTH]: message.content.length,
            [ANALYTICS_PROPERTIES.IS_PREVIEW_MODE]: isPreviewMode,
            [ANALYTICS_PROPERTIES.MODEL_ID]: chatViewModel.getModelFromLocalStorage(),
            [ANALYTICS_PROPERTIES.MESSAGE_COUNT]: messages.length + 1,
          });

          if (isPreviewMode) {
            previewMode.addMessage(message.content, false);
            
            if (messages.length === 2 && activeChat.title === "New Chat") {
              const title = message.content.slice(0, 50) + (message.content.length > 50 ? "..." : "");
              previewMode.updateTitle(title);
            }
          } else {
            sidebarViewModel.revalidateChatSummaries();
            
            // if (messages.length === 2 && activeChat.title === "New Chat") {
            //   chatViewModel.startGeneratingTitle();
            // }
          }
        }
      },
      onError: (error) => {
        console.error("[Chat] useChat error:", error);

        const errorString = error?.toString() || '';
        const errorMessage = (error as any)?.message || '';
        
        // Track API errors
        const statusCode = (error as any)?.statusCode || (error as any)?.status;
        analytics.trackError(
          "api_error",
          errorMessage || errorString,
          (error as any)?.stack,
          statusCode
        );
        
        if (isPreviewMode && (
          errorString.includes('Preview limit reached') || 
          errorMessage.includes('Preview limit reached') ||
          errorString.includes('requiresAuth')
        )) {
          analytics.track(ANALYTICS_EVENTS.PREVIEW_LIMIT_REACHED, {
            [ANALYTICS_PROPERTIES.ERROR_MESSAGE]: errorMessage || errorString,
          });
          previewMode.showLimitReachedDialog();
          return;
        }

        let toastMessage = "Failed to send message. Please try again.";

        // Check if error has status code information

        switch (statusCode) {
          case 400:
            toastMessage =
              "Invalid request. Please check your message and try again.";
            break;
          case 401:
            toastMessage =
              "Authentication error. Please refresh the page and try again.";
            break;
          case 403:
            if (isPreviewMode) {
              previewMode.showLimitReachedDialog();
              return;
            } else {
              toastMessage = "Access denied. Please try again.";
            }
            break;
          case 408:
            toastMessage = "Request timed out. Please try again.";
            break;
          case 429:
            if (isPreviewMode) {
              toastMessage = "Rate limit exceeded. Please sign in for unlimited access or try again later.";
            } else {
              toastMessage = "The AI service is currently experiencing high demand. Please wait a moment and try again.";
            }
            break;
          case 503:
            toastMessage =
              "The AI service is temporarily unavailable. Please try again later.";
            break;
          case 500:
          default:
            toastMessage =
              "Something went wrong while processing your message. Please try again.";
            break;
        }

        showToast.error(toastMessage);
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

  const handleSubmit = async (e: React.FormEvent, imageUrl?: string, pdfData?: { url: string; filename: string }) => {
    e.preventDefault();
    
    console.log('[Chat] handleSubmit called with imageUrl:', imageUrl);

    // Avoid empty submissions
    if (
      (!input.trim() && !imageUrl && !pdfData) ||
      status === "streaming" ||
      status === "submitted"
    )
      return;

    const currentInput = input.trim();

    // Track message sending
    const hasAttachments = !!(imageUrl || pdfData);
    const modelId = chatViewModel.getModelFromLocalStorage();
    
    if (isPreviewMode) {
      if (!previewMode.canSendMessage()) {
        previewMode.showLimitReachedDialog();
        return;
      }

      if (!activeChat) {
        previewMode.createConversation();
        // Track chat creation in preview mode
        analytics.trackChatCreated("preview", true);
      }

      const success = previewMode.incrementMessageCount();
      if (!success) {
        previewMode.showLimitReachedDialog();
        return;
      }
      
      previewMode.addMessage(currentInput, true);

      // Track message sent in preview mode
      analytics.trackMessageSent(
        "preview",
        currentInput.length,
        hasAttachments,
        modelId,
        true
      );

      try {
        append({
          content: currentInput,
          role: "user",
        });
      } catch (appendError) {
        if (appendError && typeof appendError === 'object') {
          const errorStr = appendError.toString();
          if (errorStr.includes('Preview limit reached') || errorStr.includes('requiresAuth')) {
            previewMode.showLimitReachedDialog();
            return;
          }
        }
        throw appendError;
      }
      return;
    }

    // If we're on home page with no active chat, create a new chat first
    if (!activeChat && pathname === "/") {
      console.log("[Chat] Creating new chat from home page with first message");
      const result = await sidebarViewModel.createNewChat();

      if (result.success && result.chatId) {
        // Track chat creation
        analytics.trackChatCreated(result.chatId, false);
        
        // Small delay to ensure database transaction is committed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Load the new chat directly without navigation for smooth UX
        const success = await chatViewModel.loadSpecificChat(result.chatId);
        if (success) {
          // Update URL using Next.js router without causing full navigation
          window.history.replaceState(null, "", `/chat/${result.chatId}`);
          sidebarViewModel.setActiveChatId(result.chatId);

          // Track message sent in new chat
          analytics.trackMessageSent(
            result.chatId,
            (currentInput || (imageUrl ? "What's on the image?" : "What would you like to know about this PDF?")).length,
            hasAttachments,
            modelId,
            false
          );

          if (imageUrl) {
            console.log('[Chat] Sending image message in new chat with URL:', imageUrl);
            append({
              content: currentInput || "What's on the image?",
              role: "user",
              data: { imageUrl }, // Store image URL in message data
            });
          } else if (pdfData) {
            console.log('[Chat] Sending PDF message in new chat with URL:', pdfData.url);
            setCurrentPDFData(pdfData);
            setTimeout(() => {
              append({
                content: currentInput || "What would you like to know about this PDF?",
                role: "user",
                data: { pdfUrl: pdfData.url, pdfFilename: pdfData.filename },
              });
              setTimeout(() => setCurrentPDFData(null), 100);
            }, 50);
          } else {
            append({
              content: currentInput,
              role: "user",
            });
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

    // For existing chats, handle image uploads with proper data
    if (activeChat) {
      // Track message sent in existing chat
      analytics.trackMessageSent(
        activeChat.id,
        (currentInput || (imageUrl ? "What's on the image?" : pdfData ? "What would you like to know about this PDF?" : "")).length,
        hasAttachments,
        modelId,
        false
      );
    }

    if (imageUrl) {
      console.log('[Chat] Sending image message with URL:', imageUrl);
      
      append({
        content: currentInput || "What's on the image?",
        role: "user",
        data: { imageUrl }, // Store image URL in message data
      });
    } else if (pdfData) {
      console.log('[Chat] Sending PDF message with URL:', pdfData.url);
      setCurrentPDFData(pdfData);
      setTimeout(() => {
        append({
          content: currentInput || "What would you like to know about this PDF?",
          role: "user",
          data: { pdfUrl: pdfData.url, pdfFilename: pdfData.filename },
        });
        setTimeout(() => setCurrentPDFData(null), 100);
      }, 50);
    } else {
      // Regular text message
      append({
        content: currentInput,
        role: "user",
      });
    }
  };

  const handlePDFProcessed = async (pdfUrl: string, filename: string) => {
    // Call /api/process-pdf to extract docs
    const res = await fetch("/api/process-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: pdfUrl, filename, sessionId: chatId }),
    });
    if (res.ok) {
      const { docs } = await res.json();
      setPdfDocs(docs);
    } else {
      setPdfDocs(null);
    }
  };

  // Setup hotkeys - only called once per Chat component
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
        <ChatHeader />
        <div className="flex-1 overflow-hidden p-1 md:p-2 flex items-center justify-center">
          <Welcome
            onCreateChat={() => {
              // Just scroll to input area or show a message
              const inputElement = document.querySelector(
                'textarea',
              ) as HTMLInputElement | HTMLTextAreaElement;
              if (inputElement) {
                inputElement.focus();
              }
            }}
            isCreating={isGenerating}
            name={user?.firstName ?? undefined}
          />
        </div>

        <ChatInput
          input={input}
          handleSubmit={handleSubmit}
          setInput={setInput}
          stop={stop}
          status={status}
          onPDFProcessed={handlePDFProcessed}
          isPreviewMode={isPreviewMode}
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
      <ChatHeader />
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
        onPDFProcessed={handlePDFProcessed}
        isPreviewMode={isPreviewMode}
      />
    </div>
  );
});
