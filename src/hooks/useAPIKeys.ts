import { useState, useEffect } from "react";
import {
  apiKeyManager,
  APIKeyConfig,
  APIKeyStatus,
  StoragePreference,
} from "@/lib/apiKeyManager";

export function useAPIKeys() {
  const [apiKeys, setApiKeys] = useState<APIKeyConfig>({});
  const [keyStatuses, setKeyStatuses] = useState<Record<string, APIKeyStatus>>(
    {},
  );
  const [storagePreference, setStoragePreference] = useState<StoragePreference>(
    { useDatabase: false, lastUpdated: null },
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadKeys = async () => {
      setIsLoading(true);
      try {
        const keys = await apiKeyManager.loadAPIKeys();
        setApiKeys(keys);

        const statuses: Record<string, APIKeyStatus> = {};
        const providers = ["OpenAI", "Anthropic", "Google", "DeepSeek"];
        providers.forEach((provider) => {
          const status = apiKeyManager.getAPIKeyStatus(provider);
          if (status) {
            statuses[provider] = status;
          }
        });
        setKeyStatuses(statuses);

        const pref = apiKeyManager.getCurrentStoragePreference();
        setStoragePreference(pref);
      } catch (error) {
        console.error("Error loading API keys:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadKeys();

    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "sys_api_keys" ||
        e.key === "sys_api_key_status" ||
        e.key === "sys_storage_preference"
      ) {
        loadKeys();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const updateAPIKey = async (provider: keyof APIKeyConfig, key: string) => {
    const newKeys = { ...apiKeys, [provider]: key };
    setApiKeys(newKeys);
    await apiKeyManager.saveAPIKeys(newKeys);

    const providerName = getProviderName(provider);
    if (providerName) {
      setKeyStatuses((prev) => {
        const newStatuses = { ...prev };
        delete newStatuses[providerName];
        return newStatuses;
      });
    }
  };

  const testAPIKey = async (provider: keyof APIKeyConfig, key: string) => {
    const providerName = getProviderName(provider);
    if (!providerName) return false;

    try {
      const isValid = await apiKeyManager.testAPIKey(provider, key);

      apiKeyManager.saveAPIKeyStatus(providerName, isValid);
      setKeyStatuses((prev) => ({
        ...prev,
        [providerName]: {
          provider: providerName,
          hasKey: true,
          isValid,
          lastChecked: new Date(),
        },
      }));

      return isValid;
    } catch (error) {
      console.error(`Error testing ${providerName} API key:`, error);
      return false;
    }
  };

  const clearAPIKey = async (provider: keyof APIKeyConfig) => {
    const newKeys = { ...apiKeys };
    delete newKeys[provider];
    setApiKeys(newKeys);
    await apiKeyManager.saveAPIKeys(newKeys);

    // Clear status
    const providerName = getProviderName(provider);
    if (providerName) {
      setKeyStatuses((prev) => {
        const newStatuses = { ...prev };
        delete newStatuses[providerName];
        return newStatuses;
      });
    }
  };

  const clearAllAPIKeys = async () => {
    await apiKeyManager.clearAPIKeys();
    setApiKeys({});
    setKeyStatuses({});
  };

  const updateStoragePreference = async (useDatabase: boolean) => {
    apiKeyManager.updateStoragePreference(useDatabase);
    setStoragePreference({ useDatabase, lastUpdated: new Date() });
  };

  const migrateToDatabase = async () => {
    const success = await apiKeyManager.migrateToDatabase();
    if (success) {
      setStoragePreference({ useDatabase: true, lastUpdated: new Date() });
      const keys = await apiKeyManager.loadAPIKeys();
      setApiKeys(keys);
    }
    return success;
  };

  const migrateToLocalStorage = async () => {
    const success = await apiKeyManager.migrateToLocalStorage();
    if (success) {
      setStoragePreference({ useDatabase: false, lastUpdated: new Date() });
      const keys = await apiKeyManager.loadAPIKeys();
      setApiKeys(keys);
    }
    return success;
  };

  const hasValidAPIKey = (provider: keyof APIKeyConfig) => {
    const key = apiKeys[provider];
    if (!key || !key.trim()) return false;

    const providerName = getProviderName(provider);
    const status = keyStatuses[providerName];

    return status?.isValid ?? false;
  };

  const getAPIKeyStatus = (provider: keyof APIKeyConfig) => {
    const providerName = getProviderName(provider);
    return keyStatuses[providerName] || null;
  };

  return {
    apiKeys,
    keyStatuses,
    storagePreference,
    isLoading,
    updateAPIKey,
    testAPIKey,
    clearAPIKey,
    clearAllAPIKeys,
    updateStoragePreference,
    migrateToDatabase,
    migrateToLocalStorage,
    hasValidAPIKey,
    getAPIKeyStatus,
  };
}

function getProviderName(provider: keyof APIKeyConfig): string {
  switch (provider) {
    case "openai":
      return "OpenAI";
    case "anthropic":
      return "Anthropic";
    case "google":
      return "Google";
    case "deepseek":
      return "DeepSeek";
    default:
      return "";
  }
}
