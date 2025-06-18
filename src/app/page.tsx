"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Chat } from "@/components/Chat";
import { Loading } from "@/components/Loading";

export default function Home() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      if (!userId) {
        setIsPreviewMode(true);
      } else {
        setIsPreviewMode(false);
      }
    }
  }, [isLoaded, userId]);

  if (!isLoaded) {
    return <Loading text="Loading..." />;
  }

  return (
    <MainLayout isPreviewMode={isPreviewMode}>
      <Chat isPreviewMode={isPreviewMode} />
    </MainLayout>
  );
}
