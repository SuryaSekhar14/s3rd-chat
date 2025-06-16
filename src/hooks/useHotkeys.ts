import { useHotkeys as useReactHotkeys } from 'react-hotkeys-hook';
import { useChatViewModel, useSidebarViewModel } from './useViewModel';
import { useOperatingSystem } from './useOperatingSystem';
import { useRouter } from 'next/navigation';
import showToast from '@/lib/toast';

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
  
  const isMac = os === 'macos';
  const modKey = isMac ? 'meta' : 'ctrl';
  
  // Stop generation with Escape
  useReactHotkeys('escape', () => {
    if (chatViewModel.generating) {
      stop();
    }
  });
  
  // Create new chat with Command/Ctrl + N
  useReactHotkeys(`${modKey}+Shift+Enter`, async (e) => {
    e.preventDefault();
    
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
  }, {
    preventDefault: true,
    enableOnFormTags: ['TEXTAREA']
  });
  
  // Enhance prompt with Command/Ctrl + E
  useReactHotkeys(`${modKey}+e`, async (e) => {
    e.preventDefault();
    chatViewModel.enhancePrompt(input, setInput);
  }, {
    enableOnFormTags: ['TEXTAREA']
  });

  return null;
}; 