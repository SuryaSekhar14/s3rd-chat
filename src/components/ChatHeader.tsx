import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { observer } from "mobx-react-lite";
import { useChatViewModel } from "@/hooks/useViewModel";
import { EditIcon } from "@/components/icons/EditIcon";
import { MagicWandIcon } from "@/components/icons/MagicWandIcon";
import { LoadingSpinner } from "./icons/LoadingSpinner";
import { truncateTitle } from "@/lib/utils";

export const ChatHeader = observer(() => {
  const chatViewModel = useChatViewModel();
  const activeChat = chatViewModel.activeChat;
  const isGenerating = chatViewModel.generating;
  
  const isEditing = chatViewModel.titleEditing;
  const editedTitle = chatViewModel.currentEditedTitle;
  const isGeneratingTitle = chatViewModel.titleGenerating;

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      await chatViewModel.saveTitleEdit();
    } else if (e.key === "Escape") {
      chatViewModel.cancelTitleEdit();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await chatViewModel.saveTitleEdit();
  };

  return (
    <div className="border-b p-2 md:p-4 flex justify-start items-center">
      <div className="flex w-full flex-wrap md:flex-nowrap items-center">
        <div className="flex items-center min-w-0">
          {isEditing ? (
            <form
              className="flex gap-2 flex-1 w-full"
              onSubmit={handleSave}
            >
              <Input
                autoFocus
                value={editedTitle}
                onChange={(e) => chatViewModel.setEditedTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-9 flex-1"
              />
              <div className="flex gap-1">
                <Button type="submit" size="sm" className="h-9">
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => chatViewModel.cancelTitleEdit()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base md:text-lg truncate">
                {truncateTitle(activeChat?.title ?? "Un-named Chat")}
              </h3>
            </div>
          )}
        </div>
        {!isEditing && (
          <div className="flex items-center gap-1 md:gap-0 ml-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => chatViewModel.startTitleEdit()}
              disabled={isGenerating || !activeChat}
              className="h-8 w-8 md:h-9 md:w-9"
              title="Rename"
            >
              <EditIcon className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => chatViewModel.startGeneratingTitle()}
              disabled={
                isGeneratingTitle ||
                isGenerating ||
                !activeChat ||
                activeChat.messages.length === 0
              }
              className="h-8 w-8 md:h-9 md:w-9"
              title="Generate Name"
            >
              {isGeneratingTitle ? (
                <LoadingSpinner className="h-4 w-4 md:h-5 md:w-5" />
              ) : (
                <MagicWandIcon className="h-4 w-4 md:h-5 md:w-5" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});
