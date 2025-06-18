"use client";

import React, { useState, useMemo, useRef } from "react";
import { observer } from "mobx-react-lite";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusIcon } from "@/components/icons/PlusIcon";
import { useChatViewModel, useSidebarViewModel } from "@/hooks/useViewModel";
import { ChatContextMenu } from "@/components/ChatContextMenu";
import { UserSection } from "@/components/UserSection";
import showToast from "@/lib/toast";
import { PanelLeft } from "lucide-react";
import type { ChatListItemHandle } from "@/components/ChatListItem";
import { usePinnedChats } from "@/hooks/usePinnedChats";
import { handleExportConversation } from "@/lib/exportUtils";
import { Input } from "@/components/ui/input";

export const Sidebar = observer(function Sidebar({
  onCollapse,
  isCollapsed,
}: {
  onCollapse?: () => void;
  isCollapsed?: boolean;
}) {
  const chatViewModel = useChatViewModel();
  const sidebarViewModel = useSidebarViewModel();
  const { pinnedChats, pinChat, unpinChat, isPinned, updatePinnedChatTitle } =
    usePinnedChats();

  const chats = sidebarViewModel.allChatSummaries;
  const activeChat = chatViewModel.activeChat;
  const isGenerating = chatViewModel.generating;
  const isLoading = sidebarViewModel.loading;

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      // Sort by database updatedAt timestamp only
      const dateA = new Date(a.updatedAt);
      const dateB = new Date(b.updatedAt);
      return dateB.getTime() - dateA.getTime();
    });
  }, [chats]);

  // Filter out pinned chats from regular chats
  const unpinnedChats = useMemo(() => {
    const pinnedIds = new Set(pinnedChats.map((chat) => chat.id));
    return sortedChats.filter((chat) => !pinnedIds.has(chat.id));
  }, [sortedChats, pinnedChats]);

  // Refs for each chat item
  const chatItemRefs = useRef<
    Record<string, React.RefObject<ChatListItemHandle | null>>
  >({});
  sortedChats.forEach((chat) => {
    if (!chatItemRefs.current[chat.id]) {
      chatItemRefs.current[chat.id] =
        React.createRef<ChatListItemHandle | null>();
    }
  });

  const [searchQuery, setSearchQuery] = useState("");

  const filteredPinnedChats = useMemo(() => {
    if (!searchQuery.trim()) return pinnedChats;
    return pinnedChats.filter((chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pinnedChats, searchQuery]);

  const filteredUnpinnedChats = useMemo(() => {
    if (!searchQuery.trim()) return unpinnedChats;
    return unpinnedChats.filter((chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [unpinnedChats, searchQuery]);

  const handleChatClick = async (id: string) => {
    if (isGenerating) {
      showToast.error("Please wait for the response to complete");
      return;
    }

    if (id !== activeChat?.id) {
      // Load the chat directly without navigation for smooth UX
      const success = await chatViewModel.loadSpecificChat(id);
      if (success) {
        // Update the URL without causing navigation using history API
        window.history.replaceState(null, "", `/chat/${id}`);
        sidebarViewModel.setActiveChatId(id);
      } else {
        showToast.error("Failed to load chat");
      }
    }
  };

  const handlePinChat = (chatId: string, title: string) => {
    if (isPinned(chatId)) {
      unpinChat(chatId);
      showToast.success("Chat unpinned");
    } else {
      pinChat(chatId, title);
      showToast.success("Chat pinned");
    }
  };

  const handleUpdateTitle = async (chatId: string, newTitle: string) => {
    const success = await sidebarViewModel.updateChatTitle(chatId, newTitle);
    if (success) {
      // Update pinned chat title if it's pinned
      updatePinnedChatTitle(chatId, newTitle);
    }
    return success;
  };

  const handleCreateNewChat = async () => {
    if (isGenerating) {
      showToast.error("Please wait for the response to complete");
      return;
    }

    chatViewModel.clearActiveChat();
    sidebarViewModel.setActiveChatId(null);

    window.history.replaceState(null, "", "/");
  };

  const handleGenerateTitle = async (chatId: string) => {
    await chatViewModel.loadSpecificChat(chatId);
    const messages = chatViewModel.getAIMessagesFromActiveChat();
    await sidebarViewModel.generateChatTitle(chatId, messages);
    // await chatViewModel.startGeneratingTitle();
  };

  const handleExportChat = async (chatId: string, title: string) => {
    await handleExportConversation(
      chatId,
      title,
      chatViewModel.loadSpecificChat,
      () => chatViewModel.activeChat
    );
  };

  return (
    <div className="flex flex-col h-full bg-muted/40 border-r">
      <div className="flex flex-col items-center justify-center p-2 md:p-4">
        <div className="flex items-center justify-center w-full mb-1">
          <h2 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-500 text-center flex-1">
            S3RD Chat
          </h2>
          {onCollapse && !isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCollapse}
              className="ml-2"
              aria-label="Collapse sidebar"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
          )}
        </div>
        <Button
          onClick={handleCreateNewChat}
          disabled={isGenerating}
          variant="default"
          size="sm"
          className="mt-3 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 text-white font-semibold shadow-lg py-2 text-sm rounded-md transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_24px_4px_rgba(139,92,246,0.5)] hover:bg-gradient-to-l hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 animate-gradient-move"
          title="New Chat"
        >
          <PlusIcon className="h-4 w-4" />
          <span>New Chat</span>
        </Button>
        <Input
          type="text"
          placeholder="Search your threads..."
          className="mt-3 w-full text-sm px-3 py-2 rounded-md bg-background border border-muted focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search chats"
        />
      </div>

      <Separator />

      <ScrollArea className="flex-1 p-1 md:p-2">
        <div className="space-y-1 md:space-y-2">
          {isLoading && (
            <div className="p-4 text-center text-muted-foreground">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Loading conversations...</span>
              </div>
            </div>
          )}

          {/* Pinned Chats Section */}
          {!isLoading && filteredPinnedChats.length > 0 && (
            <>
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Pinned Chats
              </div>
              {filteredPinnedChats.map((pinnedChat) => {
                const chat = chats.find((c) => c.id === pinnedChat.id);

                // If chat data isn't loaded yet, use the stored pinned chat data
                if (!chat) {
                  return (
                    <ChatContextMenu
                      key={pinnedChat.id}
                      chat={{
                        id: pinnedChat.id,
                        title: pinnedChat.title,
                        active: false,
                        createdAt: pinnedChat.pinnedAt,
                        updatedAt: pinnedChat.pinnedAt,
                        lastEditedAt: pinnedChat.pinnedAt,
                        persona: "none",
                      }}
                      chatItemRef={chatItemRefs.current[pinnedChat.id]}
                      isActive={false}
                      isGenerating={false}
                      isPinned={true}
                      onChatClick={handleChatClick}
                      onUpdateTitle={handleUpdateTitle}
                      onDeleteChat={sidebarViewModel.deleteChat}
                      onPinChat={handlePinChat}
                      onGenerateTitle={handleGenerateTitle}
                      onExportChat={handleExportChat}
                    />
                  );
                }

                return (
                  <ChatContextMenu
                    key={pinnedChat.id}
                    chat={chat}
                    chatItemRef={chatItemRefs.current[pinnedChat.id]}
                    isActive={chat.id === activeChat?.id}
                    isGenerating={isGenerating && chat.id === activeChat?.id}
                    isPinned={true}
                    onChatClick={handleChatClick}
                    onUpdateTitle={handleUpdateTitle}
                    onDeleteChat={sidebarViewModel.deleteChat}
                    onPinChat={handlePinChat}
                    onGenerateTitle={handleGenerateTitle}
                    onExportChat={handleExportChat}
                  />
                );
              })}
              <Separator className="my-2" />
            </>
          )}

          {/* Regular Chats Section */}
          {!isLoading && filteredUnpinnedChats.length > 0 && (
            <>
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Recent Chats
              </div>
              {filteredUnpinnedChats.map((chat) => (
                <ChatContextMenu
                  key={chat.id}
                  chat={chat}
                  chatItemRef={chatItemRefs.current[chat.id]}
                  isActive={chat.id === activeChat?.id}
                  isGenerating={isGenerating && chat.id === activeChat?.id}
                  isPinned={false}
                  onChatClick={handleChatClick}
                  onUpdateTitle={handleUpdateTitle}
                  onDeleteChat={sidebarViewModel.deleteChat}
                  onPinChat={handlePinChat}
                  onGenerateTitle={handleGenerateTitle}
                  onExportChat={handleExportChat}
                />
              ))}
            </>
          )}

          {!isLoading &&
            filteredPinnedChats.length === 0 &&
            filteredUnpinnedChats.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                No chats found.
              </div>
            )}
        </div>
      </ScrollArea>

      <Separator />
      <UserSection />
    </div>
  );
});
