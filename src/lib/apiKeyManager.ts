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

export interface StoragePreference {
  useDatabase: boolean;
  lastUpdated: Date | null;
}

const API_KEY_STORAGE_KEY = "sys_api_keys";
const API_KEY_STATUS_STORAGE_KEY = "sys_api_key_status";
const STORAGE_PREFERENCE_KEY = "sys_storage_preference";

export class APIKeyManager {
  private static instance: APIKeyManager;
  private encryptionKey = "s3rd_legend_or_wot";

  private constructor() {}

  static getInstance(): APIKeyManager {
    if (!APIKeyManager.instance) {
      APIKeyManager.instance = new APIKeyManager();
    }
    return APIKeyManager.instance;
  }

  private encrypt(text: string): string {
    if (typeof window === "undefined") return text;
    return btoa(text + this.encryptionKey);
  }

  private decrypt(encryptedText: string): string {
    if (typeof window === "undefined") return encryptedText;
    try {
      const decoded = atob(encryptedText);
      return decoded.replace(this.encryptionKey, "");
    } catch {
      return "";
    }
  }

  getCurrentStoragePreference(): StoragePreference {
    if (typeof window === "undefined")
      return { useDatabase: false, lastUpdated: null };

    try {
      const stored = localStorage.getItem(STORAGE_PREFERENCE_KEY);

      if (!stored) {
        return { useDatabase: false, lastUpdated: null };
      }

      const pref = JSON.parse(stored);

      return {
        useDatabase: pref.useDatabase || false,
        lastUpdated: pref.lastUpdated ? new Date(pref.lastUpdated) : null,
      };
    } catch (error) {
      return { useDatabase: false, lastUpdated: null };
    }
  }

  updateStoragePreference(useDatabase: boolean): void {
    if (typeof window === "undefined") return;

    const preference: StoragePreference = {
      useDatabase,
      lastUpdated: new Date(),
    };

    localStorage.setItem(STORAGE_PREFERENCE_KEY, JSON.stringify(preference));
  }

  async loadAPIKeys(): Promise<APIKeyConfig> {
    const pref = this.getCurrentStoragePreference();

    if (pref.useDatabase) {
      try {
        const res = await fetch("/api/user/api-keys");
        if (!res.ok) {
          return this.getEnvFallbackKeys();
        }
        const data = await res.json();
        const keys = data.apiKeys || {};

        if (
          Object.keys(keys).length === 0 ||
          Object.values(keys).every((key) => !key)
        ) {
          return this.getEnvFallbackKeys();
        }

        return keys;
      } catch (error) {
        return this.getEnvFallbackKeys();
      }
    } else {
      const localKeys = this.loadFromLocalStorage();

      if (
        Object.keys(localKeys).length === 0 ||
        Object.values(localKeys).every((key) => !key)
      ) {
        return this.getEnvFallbackKeys();
      }

      return localKeys;
    }
  }

  private getEnvFallbackKeys(): APIKeyConfig {
    return {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      google: process.env.GOOGLE_API_KEY,
      deepseek: process.env.DEEPSEEK_API_KEY,
    };
  }

  private loadFromLocalStorage(): APIKeyConfig {
    if (typeof window === "undefined") return {};

    try {
      const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
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
      return {};
    }
  }

  async saveAPIKeys(keys: APIKeyConfig): Promise<void> {
    const pref = this.getCurrentStoragePreference();

    if (pref.useDatabase) {
      try {
        const response = await fetch("/api/user/api-keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKeys: keys }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Database save failed: ${response.status} ${errorText}`,
          );
        }
      } catch (error) {
        console.error("Error saving API keys to database:", error);
        throw error;
      }
    } else {
      this.saveToLocalStorage(keys);
    }
  }

  private saveToLocalStorage(keys: APIKeyConfig): void {
    if (typeof window === "undefined") return;

    const encryptedKeys: Record<string, string> = {};

    Object.entries(keys).forEach(([provider, key]) => {
      if (key && key.trim()) {
        encryptedKeys[provider] = this.encrypt(key.trim());
      }
    });

    localStorage.setItem(API_KEY_STORAGE_KEY, JSON.stringify(encryptedKeys));
  }

  async clearAPIKeys(): Promise<void> {
    const pref = this.getCurrentStoragePreference();

    if (pref.useDatabase) {
      try {
        await fetch("/api/user/api-keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKeys: {} }),
        });
      } catch (error) {
        console.error("Error clearing API keys from database:", error);
        throw error;
      }
    } else {
      if (typeof window !== "undefined") {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        localStorage.removeItem(API_KEY_STATUS_STORAGE_KEY);
      }
    }
  }

  async migrateToDatabase(): Promise<boolean> {
    try {
      const localKeys = this.loadFromLocalStorage();
      await this.saveAPIKeys(localKeys);
      this.updateStoragePreference(true);
      return true;
    } catch (error) {
      console.error("Error migrating to database:", error);
      return false;
    }
  }

  async migrateToLocalStorage(): Promise<boolean> {
    try {
      const res = await fetch("/api/user/api-keys");
      if (!res.ok) {
        return false;
      }

      const data = await res.json();
      const keys = data.apiKeys || {};

      this.saveToLocalStorage(keys);
      this.updateStoragePreference(false);
      return true;
    } catch (error) {
      console.error("Error migrating to localStorage:", error);
      return false;
    }
  }

  async getAPIKey(provider: keyof APIKeyConfig): Promise<string | undefined> {
    const keys = await this.loadAPIKeys();
    return keys[provider];
  }

  getAPIKeySync(provider: keyof APIKeyConfig): string | undefined {
    const pref = this.getCurrentStoragePreference();
    if (pref.useDatabase) {
      console.warn(
        "getAPIKeySync called with database storage - returning undefined",
      );
      return undefined;
    }

    const keys = this.loadFromLocalStorage();
    return keys[provider];
  }

  async hasAPIKey(provider: keyof APIKeyConfig): Promise<boolean> {
    const key = await this.getAPIKey(provider);
    return !!key && key.trim().length > 0;
  }

  validateAPIKeyFormat(provider: keyof APIKeyConfig, key: string): boolean {
    if (!key || key.trim().length === 0) return false;

    const trimmedKey = key.trim();

    switch (provider) {
      case "openai":
        return trimmedKey.startsWith("sk-") && trimmedKey.length > 20;
      case "anthropic":
        return trimmedKey.startsWith("sk-ant-") && trimmedKey.length > 20;
      case "google":
        return trimmedKey.length > 20;
      case "deepseek":
        return trimmedKey.startsWith("sk-") && trimmedKey.length > 20;
      default:
        return trimmedKey.length > 10;
    }
  }

  async testAPIKey(
    provider: keyof APIKeyConfig,
    key: string,
  ): Promise<boolean> {
    if (!this.validateAPIKeyFormat(provider, key)) return false;

    try {
      const response = await fetch("/api/test-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(API_KEY_STATUS_STORAGE_KEY);
      const statuses: Record<string, APIKeyStatus> = stored
        ? JSON.parse(stored)
        : {};

      statuses[provider] = {
        provider,
        hasKey: true,
        isValid,
        lastChecked: new Date(),
      };

      localStorage.setItem(
        API_KEY_STATUS_STORAGE_KEY,
        JSON.stringify(statuses),
      );
    } catch (error) {
      console.error("Error saving API key status:", error);
    }
  }

  getAPIKeyStatus(provider: string): APIKeyStatus | null {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem(API_KEY_STATUS_STORAGE_KEY);
      if (!stored) return null;

      const statuses: Record<string, APIKeyStatus> = JSON.parse(stored);
      return statuses[provider] || null;
    } catch (error) {
      return null;
    }
  }

  getAllAPIKeyStatuses(): APIKeyStatus[] {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem(API_KEY_STATUS_STORAGE_KEY);
      if (!stored) return [];

      const statuses: Record<string, APIKeyStatus> = JSON.parse(stored);
      return Object.values(statuses);
    } catch (error) {
      return [];
    }
  }
}

export const apiKeyManager = APIKeyManager.getInstance();
