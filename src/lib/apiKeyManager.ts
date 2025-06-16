export interface APIKeyConfig {
  openai?: string;
  anthropic?: string;
  google?: string;
  deepseek?: string;
}

export interface APIKeyStatus {
  provider: string;
  hasKey: boolean;
  isValid?: boolean;
  lastChecked?: Date;
}

const API_KEYS_STORAGE_KEY = 'sys_api_keys';
const API_KEY_STATUS_STORAGE_KEY = 'sys_api_key_status';

export class APIKeyManager {
  private static instance: APIKeyManager;
  private encryptionKey = 's3rd_legend_or_wot';

  private constructor() {}

  static getInstance(): APIKeyManager {
    if (!APIKeyManager.instance) {
      APIKeyManager.instance = new APIKeyManager();
    }
    return APIKeyManager.instance;
  }

  private encrypt(text: string): string {
    if (typeof window === 'undefined') return text;
    return btoa(text + this.encryptionKey);
  }

  private decrypt(encryptedText: string): string {
    if (typeof window === 'undefined') return encryptedText;
    try {
      const decoded = atob(encryptedText);
      return decoded.replace(this.encryptionKey, '');
    } catch {
      return '';
    }
  }

  saveAPIKeys(keys: APIKeyConfig): void {
    if (typeof window === 'undefined') return;

    const encryptedKeys: Record<string, string> = {};
    
    Object.entries(keys).forEach(([provider, key]) => {
      if (key && key.trim()) {
        encryptedKeys[provider] = this.encrypt(key.trim());
      }
    });

    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(encryptedKeys));
  }

  loadAPIKeys(): APIKeyConfig {
    if (typeof window === 'undefined') return {};

    try {
      const stored = localStorage.getItem(API_KEYS_STORAGE_KEY);
      if (!stored) return {};

      const encryptedKeys = JSON.parse(stored);
      const decryptedKeys: APIKeyConfig = {};

      Object.entries(encryptedKeys).forEach(([provider, encryptedKey]) => {
        const decrypted = this.decrypt(encryptedKey as string);
        if (decrypted) {
          decryptedKeys[provider as keyof APIKeyConfig] = decrypted;
        }
      });

      return decryptedKeys;
    } catch (error) {
      console.error('Error loading API keys:', error);
      return {};
    }
  }

  getAPIKey(provider: keyof APIKeyConfig): string | undefined {
    const keys = this.loadAPIKeys();
    return keys[provider];
  }

  hasAPIKey(provider: keyof APIKeyConfig): boolean {
    const key = this.getAPIKey(provider);
    return !!key && key.trim().length > 0;
  }

  validateAPIKeyFormat(provider: keyof APIKeyConfig, key: string): boolean {
    if (!key || key.trim().length === 0) return false;

    const trimmedKey = key.trim();
    
    switch (provider) {
      case 'openai':
        return trimmedKey.startsWith('sk-') && trimmedKey.length > 20;
      case 'anthropic':
        return trimmedKey.startsWith('sk-ant-') && trimmedKey.length > 20;
      case 'google':
        return trimmedKey.length > 20; // Google API keys don't have a specific prefix
      case 'deepseek':
        return trimmedKey.startsWith('sk-') && trimmedKey.length > 20;
      default:
        return trimmedKey.length > 10;
    }
  }

  async testAPIKey(provider: keyof APIKeyConfig, key: string): Promise<boolean> {
    if (!this.validateAPIKeyFormat(provider, key)) return false;

    try {
      const response = await fetch('/api/test-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider, key }),
      });

      return response.ok;
    } catch (error) {
      console.error(`Error testing ${provider} API key:`, error);
      return false;
    }
  }

  saveAPIKeyStatus(provider: string, isValid: boolean): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(API_KEY_STATUS_STORAGE_KEY);
      const statuses: Record<string, APIKeyStatus> = stored ? JSON.parse(stored) : {};

      statuses[provider] = {
        provider,
        hasKey: true,
        isValid,
        lastChecked: new Date(),
      };

      localStorage.setItem(API_KEY_STATUS_STORAGE_KEY, JSON.stringify(statuses));
    } catch (error) {
      console.error('Error saving API key status:', error);
    }
  }

  getAPIKeyStatus(provider: string): APIKeyStatus | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(API_KEY_STATUS_STORAGE_KEY);
      if (!stored) return null;

      const statuses: Record<string, APIKeyStatus> = JSON.parse(stored);
      return statuses[provider] || null;
    } catch (error) {
      console.error('Error loading API key status:', error);
      return null;
    }
  }

  clearAPIKeys(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(API_KEYS_STORAGE_KEY);
    localStorage.removeItem(API_KEY_STATUS_STORAGE_KEY);
  }

  getAllAPIKeyStatuses(): APIKeyStatus[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(API_KEY_STATUS_STORAGE_KEY);
      if (!stored) return [];

      const statuses: Record<string, APIKeyStatus> = JSON.parse(stored);
      return Object.values(statuses);
    } catch (error) {
      console.error('Error loading API key statuses:', error);
      return [];
    }
  }
}

export const apiKeyManager = APIKeyManager.getInstance(); 