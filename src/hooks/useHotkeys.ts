import { useHotkeys as useReactHotkeys } from "react-hotkeys-hook";
import { useChatViewModel, useSidebarViewModel } from "./useViewModel";
import { useOperatingSystem } from "./useOperatingSystem";
import { useRouter } from "next/navigation";
import showToast from "@/lib/toast";
import { analytics, ANALYTICS_EVENTS, ANALYTICS_PROPERTIES } from "@/lib/analytics";

interface ChatActions {
  input: string;
  stop: () => void;
  setInput: (value: string) => void;
}

export const useHotkeys = (chatActions: ChatActions) => {
  const chatViewModel = useChatViewModel();
  const sidebarViewModel = useSidebarViewModel();
  const router = useRouter();
  const os = useOperatingSystem();
  const { input, stop, setInput } = chatActions;

  const isMac = os === "macos";
  const modKey = isMac ? "meta" : "ctrl";

  // Stop generation with Escape
  useReactHotkeys("escape", () => {
    if (chatViewModel.generating) {
      // Track keyboard shortcut usage
      analytics.track(ANALYTICS_EVENTS.KEYBOARD_SHORTCUT_USED, {
        [ANALYTICS_PROPERTIES.SHORTCUT_KEY]: "escape",
        action: "stop_generation",
      });
      stop();
    }
  });

  // Create new chat with Command/Ctrl + N
  useReactHotkeys(
    `${modKey}+Shift+Enter`,
    async (e) => {
      e.preventDefault();

      // Track keyboard shortcut usage
      analytics.track(ANALYTICS_EVENTS.KEYBOARD_SHORTCUT_USED, {
        [ANALYTICS_PROPERTIES.SHORTCUT_KEY]: `${modKey}+shift+enter`,
        action: "create_new_chat",
      });

      if (chatViewModel.generating) {
        showToast.error("Please wait for the response to complete");
        return;
      }

      const result = await sidebarViewModel.createNewChat();
      if (result.success && result.chatId) {
        router.push(`/chat/${result.chatId}`);
        showToast.success("New chat created");
      } else {
        showToast.error("Failed to create chat");
      }
    },
    {
      preventDefault: true,
      enableOnFormTags: ["TEXTAREA"],
    },
  );

  // Enhance prompt with Command/Ctrl + E
  useReactHotkeys(
    `${modKey}+e`,
    async (e) => {
      e.preventDefault();
      
      // Track keyboard shortcut usage
      analytics.track(ANALYTICS_EVENTS.KEYBOARD_SHORTCUT_USED, {
        [ANALYTICS_PROPERTIES.SHORTCUT_KEY]: `${modKey}+e`,
        action: "enhance_prompt",
        prompt_length: input.length,
      });
      
      chatViewModel.enhancePrompt(input, setInput);
    },
    {
      enableOnFormTags: ["TEXTAREA"],
    },
  );

  return null;
};
