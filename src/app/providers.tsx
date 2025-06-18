"use client";

import React from "react";
import { ThemeProvider } from "next-themes";
import { ClerkProvider } from "@clerk/nextjs";
import { SWRConfig } from "swr";
import { ViewModelProvider } from "@/viewmodels/ViewModelProvider";
import { swrConfig } from "@/lib/swr-config";
import { UserAnalytics } from "@/components/UserAnalytics";

export function Providers({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <ClerkProvider afterSignOutUrl="/sign-in">
      <SWRConfig value={swrConfig}>
        <ThemeProvider attribute="class">
          <ViewModelProvider>
            <UserAnalytics>{children}</UserAnalytics>
          </ViewModelProvider>
        </ThemeProvider>
      </SWRConfig>
    </ClerkProvider>
  );
}
