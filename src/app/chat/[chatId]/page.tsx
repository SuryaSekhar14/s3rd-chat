"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Chat } from "@/components/Chat";
import { useChatViewModel } from "@/hooks/useViewModel";
import { Loading } from "@/components/Loading";

export default function ChatIdPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const params = useParams();
  const chatViewModel = useChatViewModel();
  const chatId = params?.chatId as string;
  const [isLoadingChat, setIsLoadingChat] = useState(true);

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push("/sign-in");
      return;
    }

    // Only proceed if we have chatId, user is loaded and authenticated
    if (!chatId || !isLoaded || !userId) {
      return;
    }

    // Attempt to load the specific chat directly from database
    const loadSpecificChat = async () => {
      try {
        console.log("[ChatIdPage] Attempting to load chat:", chatId);

        const success = await chatViewModel.loadSpecificChat(chatId);

        if (success) {
          console.log("[ChatIdPage] Chat loaded successfully");
          setIsLoadingChat(false);
        } else {
          console.log("[ChatIdPage] Chat not found, redirecting");
          router.push("/");
        }
      } catch (error) {
        console.error("Failed to load chat:", error);
        router.push("/");
      }
    };

    loadSpecificChat();
  }, [isLoaded, userId, router, chatId, chatViewModel]);

  if (!isLoaded || isLoadingChat) {
    return <Loading text="Loading chat..." />;
  }

  return (
    <MainLayout>
      <Chat />
    </MainLayout>
  );
}
