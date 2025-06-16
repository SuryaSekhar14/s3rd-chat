import React, { useRef, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message } from "@/components/Message";
import { Button } from "@/components/ui/button";

interface MessageType {
  id: number;
  content: string;
  isUser: boolean;
  promptTokens?: number;
  completionTokens?: number;
}

interface MessageListProps {
  readonly messages: MessageType[];
  readonly isLoading?: boolean;
  readonly onSendMessage?: (message: string) => void;
}

export function MessageList({ messages, isLoading = false, onSendMessage }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const suggestions = [
    "How do I create a RESTful API with Node.js?",
    "Explain quantum computing in simple terms",
    "What?",
  ];

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollableArea = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollableArea) {
        scrollableArea.scrollTop = scrollableArea.scrollHeight;
      }
    }
  };

  const checkIfAtBottom = () => {
    if (scrollAreaRef.current) {
      const scrollableArea = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (scrollableArea) {
        const atBottom = scrollableArea.scrollHeight - scrollableArea.scrollTop - scrollableArea.clientHeight < 50;
        setIsAtBottom(atBottom);
      }
    }
  };

  useEffect(() => {
    const scrollableArea = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    checkIfAtBottom();
    if (scrollableArea) {
      scrollableArea.addEventListener('scroll', checkIfAtBottom);
      
      return () => {
        scrollableArea.removeEventListener('scroll', checkIfAtBottom);
      };
    }
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom]);

  return (
    <ScrollArea 
      className="h-[calc(100vh-150px)] md:h-[calc(100vh-160px)] scrollbar-visible min-h-[300px]"
      ref={scrollAreaRef}
    >
      <div className="space-y-3 md:space-y-4 p-2 md:p-4 pt-4 md:pt-6 pb-4 md:pb-6 min-w-[220px]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-180px)] md:h-[calc(100vh-200px)] min-h-[280px] text-center p-4 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold mb-2 min-w-[200px]">Welcome to Renben Chat!</h2>
            <p className="text-muted-foreground mb-4 text-sm md:text-base min-w-[180px]">
              This is an AI assistant. Ask me anything!
            </p>
            <div className="text-xs md:text-sm text-muted-foreground max-w-full md:max-w-md min-w-[160px]">
              <p className="mb-2">Some examples to try:</p>
              <div className="space-y-1.5 md:space-y-2">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index + 1}
                    variant="outline"
                    className="w-full justify-start p-1.5 md:p-2 h-auto text-left text-xs md:text-sm min-w-[140px]"
                    onClick={() => onSendMessage && onSendMessage(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="pt-2 md:pt-4"></div>
            {messages.map((message) => {
              return (
                <Message 
                  key={message.id} 
                  content={message.content} 
                  isUser={message.isUser} 
                  promptTokens={message.promptTokens}
                  completionTokens={message.completionTokens}
                />
              );
            })}
          </>
        )}
        
        {isLoading && (
          <div className="flex items-center space-x-2 opacity-70 mb-8 min-w-[100px]">
            <div className="h-1.5 md:h-2 w-1.5 md:w-2 rounded-full bg-foreground animate-bounce [animation-delay:-0.3s]"></div>
            <div className="h-1.5 md:h-2 w-1.5 md:w-2 rounded-full bg-foreground animate-bounce [animation-delay:-0.15s]"></div>
            <div className="h-1.5 md:h-2 w-1.5 md:w-2 rounded-full bg-foreground animate-bounce"></div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}