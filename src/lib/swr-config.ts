import { SWRConfiguration } from "swr";

// Optimized SWR configuration to reduce redundant API calls
export const swrConfig: SWRConfiguration = {
  // Global fetcher
  fetcher: async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch");
    }
    return response.json();
  },

  // Optimized settings to reduce redundant calls
  revalidateOnFocus: false, // Don't refetch when window gets focus
  revalidateOnReconnect: true, // Refetch when reconnecting to internet
  dedupingInterval: 5000, // Increased from 2000ms to 5000ms - dedupe identical requests within 5 seconds
  errorRetryCount: 2, // Retry failed requests up to 2 times
  errorRetryInterval: 1000, // Wait 1 second between retries
  revalidateIfStale: false, // Don't automatically revalidate stale data
  revalidateOnMount: true, // Only revalidate on mount if data doesn't exist
  refreshInterval: 0, // Disable automatic refresh - use manual refresh or optimistic updates
};
