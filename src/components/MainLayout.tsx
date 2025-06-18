"use client";

import React, { useState, useEffect, useRef } from "react";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import * as Cmdk from "cmdk";
import { useSidebarViewModel, useChatViewModel } from "@/hooks/useViewModel";

import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { useScreenSize } from "@/hooks/useScreenSize";
import { PanelLeft } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";
import { analytics, ANALYTICS_EVENTS, ANALYTICS_PROPERTIES } from "@/lib/analytics";

interface MainLayoutProps {
  readonly children: React.ReactNode;
  readonly isPreviewMode?: boolean;
}

function SidebarSearchCmdk({
  open,
  onOpenChange,
  chats,
  onSelectChat,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chats: { id: string; title: string }[];
  onSelectChat: (id: string) => void;
}) {
  const [search, setSearch] = React.useState("");
  const filtered = React.useMemo(
    () =>
      search.trim() === ""
        ? chats
        : chats.filter((c) =>
            c.title.toLowerCase().includes(search.toLowerCase())
          ),
    [search, chats]
  );
  
  React.useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, onOpenChange]);

  if (!open) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div className="mt-24 w-full max-w-lg rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-2xl p-0.5 transition-all duration-300">
        <Cmdk.Command
          label="Search chats"
          className="w-full rounded-2xl bg-transparent text-foreground"
        >
          <div className="relative flex items-center">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Cmdk.CommandInput
              autoFocus
              placeholder="Search or press Enter to start new chat..."
              value={search}
              onValueChange={setSearch}
              className="w-full pl-12 pr-4 py-4 text-lg bg-transparent outline-none rounded-2xl font-medium placeholder:text-muted-foreground focus:ring-2 focus:ring-indigo-400 transition-all shadow-md"
            />
            {/* Escape indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60 bg-black/20 px-2 py-1 rounded-md backdrop-blur-sm">
              Esc
            </div>
          </div>
          <Cmdk.CommandList className="max-h-80 overflow-y-auto mt-2 rounded-xl bg-black/30 backdrop-blur-xl">
            <Cmdk.CommandEmpty className="px-4 py-3 text-muted-foreground text-center">
              No chats found.
            </Cmdk.CommandEmpty>
            <Cmdk.CommandGroup className="">
              <div className="px-4 py-1 text-xs font-semibold text-indigo-300/80 tracking-wider uppercase">
                Recent Chats
              </div>
              {filtered.map((chat) => (
                <Cmdk.CommandItem
                  key={chat.id}
                  value={chat.title}
                  onSelect={() => {
                    onSelectChat(chat.id);
                    onOpenChange(false);
                  }}
                  className="px-4 py-3 my-1 mx-2 rounded-xl cursor-pointer transition-all duration-150 font-medium text-base bg-white/0 hover:bg-indigo-500/20 focus:bg-indigo-500/30 focus:text-indigo-200 hover:text-indigo-100 outline-none border border-transparent hover:border-indigo-400/40 focus:border-indigo-400/60 shadow-sm hover:scale-[1.03] focus:scale-[1.04]"
                >
                  {chat.title}
                </Cmdk.CommandItem>
              ))}
            </Cmdk.CommandGroup>
          </Cmdk.CommandList>
        </Cmdk.Command>
      </div>
    </div>
  );
}

export function MainLayout({ children, isPreviewMode = false }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isMobile } = useScreenSize();
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sidebarViewModel = useSidebarViewModel();
  const chatViewModel = useChatViewModel();
  const [cmdkOpen, setCmdkOpen] = React.useState(false);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (shortcutsDialogOpen) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        setShortcutsDialogOpen(false);
      }, 3000);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [shortcutsDialogOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        const newState = !sidebarOpen;
        setSidebarOpen(newState);
        
        // Track sidebar toggle
        analytics.track(newState ? ANALYTICS_EVENTS.SIDEBAR_EXPANDED : ANALYTICS_EVENTS.SIDEBAR_COLLAPSED, {
          [ANALYTICS_PROPERTIES.SHORTCUT_KEY]: (e.ctrlKey ? "ctrl" : "meta") + "+b",
          trigger: "keyboard",
        });
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "h") {
        e.preventDefault();
        setShortcutsDialogOpen(true);
        
        // Track help opened
        analytics.track(ANALYTICS_EVENTS.HELP_OPENED, {
          [ANALYTICS_PROPERTIES.SHORTCUT_KEY]: (e.ctrlKey ? "ctrl" : "meta") + "+h",
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdkOpen(true);
        
        // Track command palette opened
        analytics.track(ANALYTICS_EVENTS.KEYBOARD_SHORTCUT_USED, {
          [ANALYTICS_PROPERTIES.SHORTCUT_KEY]: (e.ctrlKey ? "ctrl" : "meta") + "+k",
          action: "open_command_palette",
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    
    // Track sidebar toggle
    analytics.track(newState ? ANALYTICS_EVENTS.SIDEBAR_EXPANDED : ANALYTICS_EVENTS.SIDEBAR_COLLAPSED, {
      trigger: "button",
    });
  };

  const openSidebarClass = isMobile ? "w-[85vw] max-w-[300px]" : "w-64";
  const closedSidebarClass = isMobile ? "-translate-x-full" : "w-10";

  if (isPreviewMode) {
    return (
      <div className="flex h-screen relative">
        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen relative">
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {sidebarOpen && (
        <div
          className={`
            ${isMobile ? "fixed left-0 top-0 bottom-0 z-30" : "relative"} 
            h-full border-r transition-all duration-300 ease-in-out 
            ${sidebarOpen ? openSidebarClass : closedSidebarClass}
            bg-background
          `}
        >
          <div className={`h-full block`}>
            <Sidebar onCollapse={toggleSidebar} isCollapsed={!sidebarOpen} />
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>

      {!sidebarOpen && (
        <div className="fixed top-4 left-2 z-50 flex items-center">
          <div className="flex flex-row items-center gap-2 bg-black/70 rounded-xl px-3 py-2 shadow-lg border border-white/10 backdrop-blur-md">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 rounded-lg border-none hover:bg-accent"
              aria-label="Open sidebar"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setCmdkOpen(true);
                // Track command palette opened via button
                analytics.track(ANALYTICS_EVENTS.KEYBOARD_SHORTCUT_USED, {
                  action: "open_command_palette",
                  trigger: "button",
                });
              }}
              className="h-8 w-8 rounded-lg border-none hover:bg-accent"
              aria-label="Open search"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      <SidebarSearchCmdk
        open={cmdkOpen}
        onOpenChange={setCmdkOpen}
        chats={sidebarViewModel.allChatSummaries.map((c) => ({ id: c.id, title: c.title }))}
        onSelectChat={async (id) => {
          await chatViewModel.loadSpecificChat(id);
          sidebarViewModel.setActiveChatId(id);
          window.history.replaceState(null, "", `/chat/${id}`);
        }}
      />

      <Dialog open={shortcutsDialogOpen} onOpenChange={setShortcutsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <KeyboardShortcutsHelp />
        </DialogContent>
      </Dialog>
    </div>
  );
}
