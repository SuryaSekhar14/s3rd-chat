import { useUser } from "@clerk/nextjs";
import useSWR from "swr";
import { ChatMessageJSON } from "@/models/ChatMessageModel";

// Simple fetcher function
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch");
  }
  return response.json();
};

// Simple SWR hook for conversations
export const useConversationsSWR = () => {
  const { user, isLoaded } = useUser();

  const { data, error, isLoading, mutate } = useSWR(
    user?.id && isLoaded ? "/api/conversations?excludeMessages=true" : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 10000,
      revalidateIfStale: false,
      revalidateOnMount: true,
      refreshInterval: 0,
      errorRetryCount: 1,
      errorRetryInterval: 2000,
    },
  );

  return {
    conversations: data?.conversations ?? [],
    isLoading,
    error,
    refresh: mutate,
    mutate, // Export mutate function for optimistic updates
  };
};

// Note: Removed redundant apiHelpers - use useDatabase hook instead
// to avoid duplicate API call logic and leverage SWR optimistic updates
