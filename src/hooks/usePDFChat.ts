import { useChat } from "@ai-sdk/react";
import { useCallback } from "react";

interface UsePDFChatProps {
  pdfUrl: string;
  filename: string;
  sessionId?: string;
  model?: string;
}

export function usePDFChat({ pdfUrl, filename, sessionId, model }: UsePDFChatProps) {
  const {
    messages,
    append,
    status,
    setInput,
    input,
    stop,
    setMessages,
  } = useChat({
    api: "/api/process-pdf",
    id: sessionId,
    body: {
      url: pdfUrl,
      filename,
      sessionId,
      model,
    },
    streamProtocol: "data",
  });

  const askQuestion = useCallback(
    async (question: string) => {
      if (!question.trim()) return;

      await append({
        content: question,
        role: "user",
      });
    },
    [append]
  );

  return {
    messages,
    askQuestion,
    status,
    setInput,
    input,
    stop,
    setMessages,
    isStreaming: status === "streaming" || status === "submitted",
  };
} 