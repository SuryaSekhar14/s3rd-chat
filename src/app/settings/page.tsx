"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { APIKeySettings } from "@/components/APIKeySettings";
import { Settings, Key, Palette, ArrowLeft, User, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("api-keys");
  const router = useRouter();
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
              className="h-10 w-10 rounded-full hover:bg-muted/80"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted-foreground text-sm">
                  Configure your chat preferences and API keys
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg font-semibold">Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                    <AvatarFallback className="text-2xl bg-primary/10">
                      {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="space-y-4 text-center">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {user?.fullName || "User"}
                    </h3>
                    {user?.emailAddresses && user.emailAddresses.length > 0 && (
                      <div className="flex items-center justify-center gap-2 mt-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">
                          {user.emailAddresses[0].emailAddress}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Active Account</span>
                  </div>
                  {user?.createdAt && (
                    <div className="text-xs text-muted-foreground">
                      Member since {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="space-y-2 pt-4 border-t">
                  <Button variant="outline" className="w-full" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="api-keys" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  API Keys
                </TabsTrigger>
                <TabsTrigger value="appearance" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Appearance
                </TabsTrigger>
              </TabsList>
              <div className="mt-8">
                <TabsContent value="api-keys" className="space-y-6">
                  <APIKeySettings />
                </TabsContent>
                <TabsContent value="appearance" className="space-y-6">
                  <div className="space-y-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between p-6 border rounded-lg">
                        <div>
                          <h3 className="text-lg font-semibold">Theme</h3>
                          <p className="text-muted-foreground">
                            Toggle between light and dark mode
                          </p>
                        </div>
                        <ThemeToggle />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
} 