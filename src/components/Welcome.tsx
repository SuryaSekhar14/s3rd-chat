"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";
import Image from "next/image";

interface WelcomeProps {
  readonly onCreateChat: () => void;
  readonly isCreating?: boolean;
}

export function Welcome({ onCreateChat, isCreating = false }: WelcomeProps) {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo */}
        <div className="space-y-6">
          <div className="w-20 h-20 mx-auto">
            <Image
              src="/logo.svg"
              alt="Renben Chat"
              width={80}
              height={80}
              className="w-full h-full"
            />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">
              Welcome to Renben Chat
            </h1>
            <p className="text-muted-foreground">
              Your intelligent AI companion for meaningful conversations
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-4">
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