"use client";

import React, { useState, useEffect, useRef } from "react";

import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { useScreenSize } from "@/hooks/useScreenSize";
import { PanelLeft } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";

import { SettingsIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useRouter } from "next/navigation";

interface MainLayoutProps {
  readonly children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isMobile } = useScreenSize();
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  


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
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setShortcutsDialogOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const openSidebarClass = isMobile ? 'w-[85vw] max-w-[300px]' : 'w-64';
  const closedSidebarClass = isMobile ? '-translate-x-full' : 'w-10';

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
            ${isMobile ? 'fixed left-0 top-0 bottom-0 z-30' : 'relative'} 
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
      {!sidebarOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="absolute top-4 left-2 z-40 h-8 w-8 rounded-full border bg-background shadow-sm"
          aria-label="Open sidebar"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
      )}
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute top-4 right-6 z-30 flex items-center gap-2">
          <button
            className="bg-muted/80 hover:bg-muted border border-border shadow-lg rounded-full p-1.5 transition-colors duration-200 hover:scale-105"
            onClick={() => router.push('/settings')}
            aria-label="Open settings"
          >
            <SettingsIcon className="h-4 w-4 text-foreground" />
          </button>
          <ThemeToggle />
        </div>
        {children}
      </div>
      <Dialog open={shortcutsDialogOpen} onOpenChange={setShortcutsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <KeyboardShortcutsHelp />
        </DialogContent>
      </Dialog>
    </div>
  );
} 