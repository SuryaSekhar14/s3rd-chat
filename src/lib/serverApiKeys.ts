import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@/generated/prisma";
import crypto from "crypto";

const prisma = new PrismaClient();
const ENCRYPTION_KEY =
  process.env.API_KEY_ENCRYPTION_KEY || "12345678901234567890123456789012";

function decrypt(text: string): string {
  try {
    const [ivHex, encrypted] = text.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32).padEnd(32, "0"));
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt API key");
  }
}

export interface ServerAPIKeyConfig {
  openai?: string;
  anthropic?: string;
  google?: string;
  deepseek?: string;
}

export async function loadServerAPIKeys(): Promise<ServerAPIKeyConfig> {
  try {
    const { userId } = await auth();
    
    console.log("[DEBUG] loadServerAPIKeys called, userId:", userId);
    
    if (!userId) {
      console.log("[DEBUG] No userId, returning env fallback");
      const envKeys = getEnvFallbackKeys();
      console.log("[DEBUG] Env keys:", Object.keys(envKeys).reduce((acc, key) => {
        const typedKey = key as keyof ServerAPIKeyConfig;
        acc[typedKey] = envKeys[typedKey] ? `${envKeys[typedKey]!.substring(0, 8)}...` : undefined;
        return acc;
      }, {} as Record<keyof ServerAPIKeyConfig, string | undefined>));
      return envKeys;
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: {
        openaiApiKey: true,
        anthropicApiKey: true,
        googleApiKey: true,
        deepseekApiKey: true,
      },
    });

    console.log("[DEBUG] User found:", !!user);
    if (user) {
      console.log("[DEBUG] User has keys:", {
        openai: !!user.openaiApiKey,
        anthropic: !!user.anthropicApiKey,
        google: !!user.googleApiKey,
        deepseek: !!user.deepseekApiKey
      });
    }

    if (!user) {
      console.log("[DEBUG] No user found, returning env fallback");
      return getEnvFallbackKeys();
    }

    const decryptedKeys: ServerAPIKeyConfig = {
      openai: user.openaiApiKey ? decrypt(user.openaiApiKey) : undefined,
      anthropic: user.anthropicApiKey ? decrypt(user.anthropicApiKey) : undefined,
      google: user.googleApiKey ? decrypt(user.googleApiKey) : undefined,
      deepseek: user.deepseekApiKey ? decrypt(user.deepseekApiKey) : undefined,
    };

    const hasUserKeys = Object.values(decryptedKeys).some(key => key && key.trim());
    console.log("[DEBUG] User has any keys:", hasUserKeys);
    
    if (!hasUserKeys) {
      console.log("[DEBUG] No user keys, returning env fallback");
      return getEnvFallbackKeys();
    }

    const finalKeys = {
      openai: decryptedKeys.openai || process.env.OPENAI_API_KEY,
      anthropic: decryptedKeys.anthropic || process.env.ANTHROPIC_API_KEY,
      google: decryptedKeys.google || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      deepseek: decryptedKeys.deepseek || process.env.DEEPSEEK_API_KEY,
    };
    
    console.log("[DEBUG] Final keys:", Object.keys(finalKeys).reduce((acc, key) => {
      const typedKey = key as keyof ServerAPIKeyConfig;
      acc[typedKey] = finalKeys[typedKey] ? `${finalKeys[typedKey]!.substring(0, 8)}...` : undefined;
      return acc;
    }, {} as Record<keyof ServerAPIKeyConfig, string | undefined>));
    
    return finalKeys;
  } catch (error) {
    console.error("Error loading server API keys:", error);
    return getEnvFallbackKeys();
  }
}

function getEnvFallbackKeys(): ServerAPIKeyConfig {
  return {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    google: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
  };
} 