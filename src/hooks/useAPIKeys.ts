import { useState, useEffect } from 'react';
import { apiKeyManager, APIKeyConfig, APIKeyStatus } from '@/lib/apiKeyManager';

export function useAPIKeys() {
  const [apiKeys, setApiKeys] = useState<APIKeyConfig>({});
  const [keyStatuses, setKeyStatuses] = useState<Record<string, APIKeyStatus>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadKeys = () => {
      const keys = apiKeyManager.loadAPIKeys();
      setApiKeys(keys);
      
      const statuses: Record<string, APIKeyStatus> = {};
      const providers = ['OpenAI', 'Anthropic', 'Google', 'DeepSeek'];
      providers.forEach(provider => {
        const status = apiKeyManager.getAPIKeyStatus(provider);
        if (status) {
          statuses[provider] = status;
        }
      });
      setKeyStatuses(statuses);
      setIsLoading(false);
    };

    loadKeys();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sys_api_keys' || e.key === 'sys_api_key_status') {
        loadKeys();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateAPIKey = (provider: keyof APIKeyConfig, key: string) => {
    const newKeys = { ...apiKeys, [provider]: key };
    setApiKeys(newKeys);
    apiKeyManager.saveAPIKeys(newKeys);
    
    const providerName = getProviderName(provider);
    if (providerName) {
      setKeyStatuses(prev => {
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
      setKeyStatuses(prev => ({
        ...prev,
        [providerName]: {
          provider: providerName,
          hasKey: true,
          isValid,
          lastChecked: new Date()
        }
      }));
      
      return isValid;
    } catch (error) {
      console.error(`Error testing ${providerName} API key:`, error);
      return false;
    }
  };

  const clearAPIKey = (provider: keyof APIKeyConfig) => {
    const newKeys = { ...apiKeys };
    delete newKeys[provider];
    setApiKeys(newKeys);
    apiKeyManager.saveAPIKeys(newKeys);
    
    // Clear status
    const providerName = getProviderName(provider);
    if (providerName) {
      setKeyStatuses(prev => {
        const newStatuses = { ...prev };
        delete newStatuses[providerName];
        return newStatuses;
      });
    }
  };

  const clearAllAPIKeys = () => {
    apiKeyManager.clearAPIKeys();
    setApiKeys({});
    setKeyStatuses({});
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
    isLoading,
    updateAPIKey,
    testAPIKey,
    clearAPIKey,
    clearAllAPIKeys,
    hasValidAPIKey,
    getAPIKeyStatus
  };
}

function getProviderName(provider: keyof APIKeyConfig): string {
  switch (provider) {
    case 'openai': return 'OpenAI';
    case 'anthropic': return 'Anthropic';
    case 'google': return 'Google';
    case 'deepseek': return 'DeepSeek';
    default: return '';
  }
} 