"use client";

import React, { createContext, useContext, useEffect } from "react";
import { observer } from "mobx-react-lite";

import { useUser } from "@clerk/nextjs";

import { ChatViewModel } from "./ChatViewModel";
import { SidebarViewModel } from "./SidebarViewModel";
import { useDatabase } from "@/hooks/useDatabase";

const ViewModelContext = createContext<{
  chatViewModel: ChatViewModel;
  sidebarViewModel: SidebarViewModel;
} | null>(null);

export const useViewModels = () => {
  const context = useContext(ViewModelContext);
  if (!context) {
    throw new Error("useViewModels must be used within ViewModelProvider");
  }
  return context;
};

// Create single instances that will be reused
const chatViewModel = new ChatViewModel();
const sidebarViewModel = new SidebarViewModel();

export const ViewModelProvider = observer(function ViewModelProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useUser();
  const databaseMethods = useDatabase();

  // Inject dependencies into ViewModels
  useEffect(() => {
    // Set database methods with updated user state for both view models
    const methodsWithUserState = {
      ...databaseMethods,
      isUserLoaded: isLoaded,
      userId: user?.id,
    };

    chatViewModel.setDatabaseMethods(methodsWithUserState);
    sidebarViewModel.setDatabaseMethods(methodsWithUserState);

    // Connect the view models for coordination
    chatViewModel.setSidebarViewModel({
      revalidateChatSummaries: () => sidebarViewModel.revalidateChatSummaries(),
    });

    // Trigger sync when user becomes authenticated
    if (isLoaded && user?.id) {
      console.log(
        "[ViewModelProvider] User authenticated, triggering database sync",
      );
      setTimeout(() => {
        sidebarViewModel.syncOnAuthentication();
      }, 0);
    }
  }, [databaseMethods, isLoaded, user?.id]);

  return (
    <ViewModelContext.Provider value={{ chatViewModel, sidebarViewModel }}>
      {children}
    </ViewModelContext.Provider>
  );
});
