"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loading } from "@/components/Loading";

export default function ChatPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push("/sign-in");
      return;
    }

    // Always redirect /chat to home page
    if (isLoaded && userId) {
      router.push("/");
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded) {
    return <Loading text="Redirecting..." />;
  }

  return <Loading text="Redirecting..." />;
}
