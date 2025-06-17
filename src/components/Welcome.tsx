"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, Sparkles, Globe, Zap } from "lucide-react";
import Image from "next/image";

interface WelcomeProps {
  readonly onCreateChat: () => void;
  readonly isCreating?: boolean;
  readonly name?: string;
}

export function Welcome({ onCreateChat, isCreating = false, name }: WelcomeProps) {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto">
            <Image
              src="/logo.svg"
              alt="S3RD Chat"
              width={80}
              height={80}
              className="w-full h-full"
            />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold">
              Welcome to S3RD Chat{name ? `, ${name}` : ""}
            </h1>
            <p className="text-muted-foreground text-lg">
              Your intelligent AI companion with web search capabilities
            </p>
          </div>
        </div>

        <div className="flex flex-row gap-4 mb-8">
          <div className="flex-1 p-4 bg-muted/50 rounded-lg text-center">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold mb-1">Multi-Model AI</h3>
            <p className="text-sm text-muted-foreground">
              Chat with GPT-4o, Claude, Gemini, and DeepSeek
            </p>
          </div>

          <div className="flex-1 p-4 bg-muted/50 rounded-lg text-center">
            <Globe className="w-8 h-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold mb-1">Web Search</h3>
            <p className="text-sm text-muted-foreground">
              Get up-to-date information from the web
            </p>
          </div>

          <div className="flex-1 p-4 bg-muted/50 rounded-lg text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold mb-1">Real-time</h3>
            <p className="text-sm text-muted-foreground">
              Fast, streaming responses with conversation history
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Button
            onClick={onCreateChat}
            size="lg"
            className="h-12 px-8 text-base"
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <MessageSquarePlus className="w-5 h-5 mr-2" />
                Start Chatting
              </>
            )}
          </Button>

          <p className="text-sm text-muted-foreground">
            Type your message below to begin
          </p>
        </div>
      </div>
    </div>
  );
}
