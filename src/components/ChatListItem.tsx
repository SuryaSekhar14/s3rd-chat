import React, { useState, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditIcon } from "@/components/icons/EditIcon";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import { formatDateToWords, truncateTitle } from "@/lib/utils";
import { uiConfig } from "@/lib/config";
import showToast from "@/lib/toast";
import type { Chat } from "@/lib/types";
import { ChatSummary } from "@/viewmodels/SidebarViewModel";

// Create a union type for chat that works with both Chat and ChatSummary
type ChatType = Chat | ChatSummary;

interface ChatListItemProps {
  readonly chat: ChatType;
  readonly isActive: boolean;
  readonly isGenerating: boolean;
  readonly onChatClick: (id: string) => void;
  readonly onUpdateTitle: (id: string, title: string) => Promise<boolean>;
  readonly onDeleteChat: (id: string) => Promise<boolean>;
}

export interface ChatListItemHandle {
  startRename: () => void;
}

export const ChatListItem = forwardRef<ChatListItemHandle, ChatListItemProps>(function ChatListItem({
  chat,
  isActive,
  isGenerating,
  onChatClick,
  onUpdateTitle,
  onDeleteChat,
}: ChatListItemProps, ref) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedTitle, setEditedTitle] = useState(chat.title);
  const [isSaving, setIsSaving] = useState(false);

  useImperativeHandle(ref, () => ({
    startRename: () => {
      if (isGenerating) return;
      setIsEditing(true);
      setEditedTitle(chat.title);
    },
  }), [isGenerating, chat.title]);

  const handleStartRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGenerating) return;
    setIsEditing(true);
    setEditedTitle(chat.title);
  };

  const handleSaveRename = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedTitle = editedTitle.trim();
    if (!trimmedTitle) {
      showToast.error("Title cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const success = await onUpdateTitle(chat.id, trimmedTitle);
      if (success) {
        setIsEditing(false);
        showToast.success("Chat renamed successfully");
      }
    } catch (error) {
      console.error("Error updating title:", error);
      showToast.error("Failed to rename chat");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGenerating) {
      showToast.error("Please wait for the response to complete");
      return;
    }
    setIsDeleting(true);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await onDeleteChat(chat.id);
      setIsDeleting(false);
    } catch (error) {
      console.error("Error deleting chat:", error);
      showToast.error("Failed to delete chat");
      setIsDeleting(false);
    }
  };

  // Helper function to get formatted date whether the chat is a Chat or ChatSummary
  const getFormattedDate = () => {
    if ('lastEditedAt' in chat) {
      // Check if updatedAt is a Date object or a string
      if (chat.lastEditedAt as any instanceof Date) {
        return formatDateToWords(chat.lastEditedAt as any as Date);
      } else {
        return formatDateToWords(new Date(chat.lastEditedAt as string));
      }
    }
    return '';
  };

  return (
    <button
      onClick={() => onChatClick(chat.id)}
      type="button"
      className={`
        flex items-center justify-between p-1.5 md:p-2 rounded-md cursor-pointer
        hover:bg-accent hover:text-accent-foreground group w-full text-left
        ${isActive ? "bg-accent text-accent-foreground" : ""}
        ${isGenerating && isActive ? "opacity-80" : ""}
      `}
    >
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <form onSubmit={handleSaveRename}>
            <div className="flex gap-1">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                maxLength={50}
                className="h-6 md:h-7 py-1 text-xs md:text-sm"
                disabled={isSaving}
              />
              <Button
                type="submit"
                size="sm"
                className="h-6 md:h-7 px-1.5 md:px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveRename();
                }}
                disabled={isSaving}
              >
                {isSaving ? "..." : "Save"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 md:h-7 px-1.5 md:px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(false);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="truncate">
            <span className="truncate text-sm md:text-base">
              {truncateTitle(chat.title, uiConfig.maxSidebarChatTitleLength)}
            </span>
            <div className="text-xs md:text-xs text-muted-foreground truncate">
              {getFormattedDate()}
            </div>
          </div>
        )}
      </div>
      {!isEditing && false && (
        <div className="flex gap-0.5 items-center">
          {isDeleting ? (
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 w-8 md:h-7 md:w-7 p-0 text-destructive hover:text-destructive border-2 border-destructive"
                onClick={handleConfirmDelete}
              >
                <CheckIcon className="h-4 w-4" />
                <span className="sr-only">Confirm Delete</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 w-8 md:h-7 md:w-7 p-0 border-2 border-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleting(false);
                }}
              >
                <Cross2Icon className="h-4 w-4" />
                <span className="sr-only">Cancel Delete</span>
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStartRename}
                className="h-6 w-6 md:h-7 md:w-7 p-0"
                disabled={isGenerating}
              >
                <EditIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStartDelete}
                className="h-6 w-6 md:h-7 md:w-7 p-0 text-destructive hover:text-destructive"
                disabled={isGenerating}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )}
    </button>
  );
}); 