import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { deepseek } from "@ai-sdk/deepseek";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider, key } = await req.json();
    
    if (!provider || !key) {
      return NextResponse.json({ error: 'Provider and key are required' }, { status: 400 });
    }

    let isValid = false;
    let errorMessage = '';

    try {
      switch (provider) {
        case 'openai':
          process.env.OPENAI_API_KEY = key;
          break;
        case 'anthropic':
          process.env.ANTHROPIC_API_KEY = key;
          break;
        case 'google':
          process.env.GOOGLE_GENERATIVE_AI_API_KEY = key;
          break;
        case 'deepseek':
          process.env.DEEPSEEK_API_KEY = key;
          break;
        default:
          errorMessage = 'Unsupported provider';
          break;
      }

      if (!errorMessage) {
        let testModel;
        switch (provider) {
          case 'openai':
            testModel = openai('gpt-4o-mini');
            break;
          case 'anthropic':
            testModel = anthropic('claude-3-5-sonnet-20241022');
            break;
          case 'google':
            testModel = google('gemini-2.5-flash-preview-04-17');
            break;
          case 'deepseek':
            testModel = deepseek('deepseek-chat');
            break;
          default:
            errorMessage = 'Unsupported provider';
            break;
        }

        if (testModel) {
          const result = streamText({
            model: testModel,
            messages: [{ role: 'user', content: 'Say "Hello" in one word.' }],
            maxTokens: 5,
          });

          const reader = result.textStream.getReader();
          const { done, value } = await reader.read();
          
          if (!done && value) {
            isValid = true;
          }
          
          reader.releaseLock();
        }
      }
    } catch (error) {
      console.error(`Error testing ${provider} API key:`, error);
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      isValid = false;
    }

    return NextResponse.json({
      isValid,
      error: errorMessage || undefined,
    });

  } catch (error) {
    console.error('Error in test-api-key API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 