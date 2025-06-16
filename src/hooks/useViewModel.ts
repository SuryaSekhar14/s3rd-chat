import { useViewModels } from '@/viewmodels/ViewModelProvider';

// Convenience hook for ChatViewModel
export const useChatViewModel = () => {
  const { chatViewModel } = useViewModels();
  return chatViewModel;
};

// Convenience hook for SidebarViewModel
export const useSidebarViewModel = () => {
  const { sidebarViewModel } = useViewModels();
  return sidebarViewModel;
}; 