"use client";

import React from "react";
import { ThemeProvider } from "next-themes";
import { ClerkProvider } from "@clerk/nextjs";
import { SWRConfig } from "swr";
import { ViewModelProvider } from "@/viewmodels/ViewModelProvider";
import { swrConfig } from "@/lib/swr-config";

export function Providers({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <ClerkProvider afterSignOutUrl="/sign-in">
      <SWRConfig value={swrConfig}>
        <ThemeProvider attribute="class">
          <ViewModelProvider>{children}</ViewModelProvider>
        </ThemeProvider>
      </SWRConfig>
    </ClerkProvider>
  );
}
