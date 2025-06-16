"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Chat } from "@/components/Chat";
import { Loading } from "@/components/Loading";

export default function Home() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push("/sign-in");
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded) {
    return <Loading text="Loading..." />;
  }

  return (
    <MainLayout>
      <Chat />
    </MainLayout>
  );
}
