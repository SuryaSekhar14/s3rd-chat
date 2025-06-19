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

export const useConversationsSWR = () => {
  const { user, isLoaded } = useUser();

  const { data, error, isLoading, mutate } = useSWR(
    user?.id && isLoaded ? "/api/conversations?excludeMessages=true" : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000,
      revalidateIfStale: false,
      revalidateOnMount: true,
      refreshInterval: 0,
      errorRetryCount: 1,
      errorRetryInterval: 2000,
      focusThrottleInterval: 60000,
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

export const useConversationSWR = (conversationId: string | null, options?: { recentOnly?: boolean; limit?: number }) => {
  const { user, isLoaded } = useUser();

  const params = new URLSearchParams();
  if (options?.recentOnly) {
    params.set("recent", "true");
    params.set("limit", (options.limit || 50).toString());
  }
  const queryString = params.toString();
  
  const key = conversationId && user?.id && isLoaded 
    ? `/api/conversations/${conversationId}${queryString ? `?${queryString}` : ""}`
    : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      revalidateIfStale: false,
      revalidateOnMount: true,
      refreshInterval: 0,
      errorRetryCount: 2,
      errorRetryInterval: 1000,
      keepPreviousData: true,
    }
  );

  return {
    conversation: data?.conversation ?? null,
    isLoading,
    error,
    refresh: mutate,
    mutate,
  };
};

// Note: Removed redundant apiHelpers - use useDatabase hook instead
// to avoid duplicate API call logic and leverage SWR optimistic updates
