"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { APIKeySettings } from "@/components/APIKeySettings";
import { Settings, Key, Palette, X } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const [activeTab, setActiveTab] = useState("api-keys");

  useEffect(() => {
    if (open) {
      setActiveTab("api-keys");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Configure your chat preferences and API keys
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 max-h-[60vh] overflow-y-auto">
            <TabsContent value="api-keys" className="space-y-4">
              <APIKeySettings />
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="theme"
                  className="text-sm font-medium leading-none"
                >
                  Theme
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Toggle between light and dark mode
                  </span>
                  <ThemeToggle />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
