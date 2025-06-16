import React from "react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";
import { EditIcon } from "@/components/icons/EditIcon";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { MagicWandIcon } from "@/components/icons/MagicWandIcon";
import { DownloadIcon } from "@/components/icons/DownloadIcon";
import { Pin } from "lucide-react";
import { ChatListItem } from "@/components/ChatListItem";
import type { ChatListItemHandle } from "@/components/ChatListItem";
import { ChatSummary } from "@/viewmodels/SidebarViewModel";

interface ChatContextMenuProps {
  chat: ChatSummary;
  chatItemRef: React.RefObject<ChatListItemHandle | null>;
  isActive: boolean;
  isGenerating: boolean;
  isPinned: boolean;
  onChatClick: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => Promise<boolean>;
  onDeleteChat: (id: string) => Promise<boolean>;
  onPinChat: (chatId: string, title: string) => void;
  onGenerateTitle: (chatId: string) => Promise<void>;
  onExportChat: (chatId: string, title: string) => Promise<void>;
}

export const ChatContextMenu: React.FC<ChatContextMenuProps> = ({
  chat,
  chatItemRef,
  isActive,
  isGenerating,
  isPinned,
  onChatClick,
  onUpdateTitle,
  onDeleteChat,
  onPinChat,
  onGenerateTitle,
  onExportChat,
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div>
          <ChatListItem
            ref={chatItemRef}
            chat={chat}
            isActive={isActive}
            isGenerating={isGenerating}
            onChatClick={onChatClick}
            onUpdateTitle={onUpdateTitle}
            onDeleteChat={onDeleteChat}
          />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => chatItemRef.current?.startRename()}>
          <EditIcon className="h-4 w-4 mr-2" /> Edit title
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onPinChat(chat.id, chat.title)}>
          <Pin className="h-4 w-4 mr-2" /> {isPinned ? "Unpin" : "Pin"}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={async () => {
            if (isGenerating) return;
            await onGenerateTitle(chat.id);
          }}
          disabled={isGenerating}
        >
          <MagicWandIcon className="h-4 w-4 mr-2" /> Generate title
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onExportChat(chat.id, chat.title)}
        >
          <DownloadIcon className="h-4 w-4 mr-2" /> Export
        </ContextMenuItem>
        <ContextMenuItem variant="destructive" onClick={() => onDeleteChat(chat.id)}>
          <TrashIcon className="h-4 w-4 mr-2" /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}; 