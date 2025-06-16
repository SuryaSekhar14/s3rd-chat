import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@/generated/prisma';
import crypto from 'crypto';

const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_KEY || '12345678901234567890123456789012';

function encrypt(text: string): string {
  try {
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32).padEnd(32, '0'));
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt API key');
  }
}

function decrypt(text: string): string {
  try {
    const [ivHex, encrypted] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32).padEnd(32, '0'));
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt API key');
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: {
        openaiApiKey: true,
        anthropicApiKey: true,
        googleApiKey: true,
        deepseekApiKey: true,
      }
    });

    if (!user) {
      user = await prisma.user.create({ 
        data: { clerkUserId: userId },
        select: {
          openaiApiKey: true,
          anthropicApiKey: true,
          googleApiKey: true,
          deepseekApiKey: true,
        }
      });
    }

    const decryptedKeys = {
      openai: user.openaiApiKey ? decrypt(user.openaiApiKey) : undefined,
      anthropic: user.anthropicApiKey ? decrypt(user.anthropicApiKey) : undefined,
      google: user.googleApiKey ? decrypt(user.googleApiKey) : undefined,
      deepseek: user.deepseekApiKey ? decrypt(user.deepseekApiKey) : undefined,
    };

    return NextResponse.json({ apiKeys: decryptedKeys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { apiKeys } = await req.json();
    
    if (!apiKeys || typeof apiKeys !== 'object') {
      return NextResponse.json({ error: 'Invalid API keys data' }, { status: 400 });
    }

    let user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) {
      user = await prisma.user.create({ data: { clerkUserId: userId } });
    }

    const updateData: any = {};
    if (apiKeys.openai !== undefined) updateData.openaiApiKey = apiKeys.openai ? encrypt(apiKeys.openai) : null;
    if (apiKeys.anthropic !== undefined) updateData.anthropicApiKey = apiKeys.anthropic ? encrypt(apiKeys.anthropic) : null;
    if (apiKeys.google !== undefined) updateData.googleApiKey = apiKeys.google ? encrypt(apiKeys.google) : null;
    if (apiKeys.deepseek !== undefined) updateData.deepseekApiKey = apiKeys.deepseek ? encrypt(apiKeys.deepseek) : null;

    await prisma.user.update({ where: { id: user.id }, data: updateData });
    
    return NextResponse.json({ success: true, message: 'API keys saved successfully' });
  } catch (error) {
    console.error('Error saving API keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { provider } = await req.json();
    if (!provider) return NextResponse.json({ error: 'Provider is required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const updateData: any = {};
    switch (provider) {
      case 'openai': updateData.openaiApiKey = null; break;
      case 'anthropic': updateData.anthropicApiKey = null; break;
      case 'google': updateData.googleApiKey = null; break;
      case 'deepseek': updateData.deepseekApiKey = null; break;
      default: return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    await prisma.user.update({ where: { id: user.id }, data: updateData });
    return NextResponse.json({ success: true, message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 