"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Download, History, RotateCcw } from "lucide-react";
import showToast from "@/lib/toast";

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    messages: number;
  };
  messages?: Array<{
    id: string;
    content: string;
    isUser: boolean;
    aiModel?: string;
    createdAt: string;
  }>;
}

export const ChatHistory = () => {
  const { user } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/conversations?excludeMessages=true");
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      } else {
        showToast.error("Failed to load chat history");
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      showToast.error("Failed to load chat history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedConversations(new Set(conversations.map(c => c.id)));
    } else {
      setSelectedConversations(new Set());
    }
  };

  const handleSelectConversation = (conversationId: string, checked: boolean) => {
    const newSelection = new Set(selectedConversations);
    if (checked) {
      newSelection.add(conversationId);
    } else {
      newSelection.delete(conversationId);
    }
    setSelectedConversations(newSelection);
  };

  const handleDeleteSelected = async () => {
    if (selectedConversations.size === 0) return;

    try {
      setDeleting(true);
      const response = await fetch("/api/chat-history", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationIds: Array.from(selectedConversations),
        }),
      });

      if (response.ok) {
        showToast.success(`Deleted ${selectedConversations.size} conversation(s)`);
        setSelectedConversations(new Set());
        await fetchConversations();
      } else {
        showToast.error("Failed to delete conversations");
      }
    } catch (error) {
      console.error("Error deleting conversations:", error);
      showToast.error("Failed to delete conversations");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    try {
      setDeleting(true);
      const response = await fetch("/api/chat-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "deleteAll",
        }),
      });

      if (response.ok) {
        showToast.success("All conversations deleted");
        setSelectedConversations(new Set());
        await fetchConversations();
      } else {
        showToast.error("Failed to delete all conversations");
      }
    } catch (error) {
      console.error("Error deleting all conversations:", error);
      showToast.error("Failed to delete all conversations");
    } finally {
      setDeleting(false);
    }
  };

  const handleExportSelected = async () => {
    if (selectedConversations.size === 0) {
      showToast.error("Please select conversations to export");
      return;
    }

    try {
      setExporting(true);
      const response = await fetch("/api/chat-history");
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }
      
      const data = await response.json();
      const allConversationsWithMessages = data.conversations || [];
      
      const selectedConversationsData = allConversationsWithMessages.filter((conv: Conversation) =>
        selectedConversations.has(conv.id)
      );

      const exportData = {
        exportedAt: new Date().toISOString(),
        user: {
          id: user?.id,
          email: user?.emailAddresses?.[0]?.emailAddress,
          name: user?.fullName,
        },
        conversations: selectedConversationsData.map((conv: Conversation) => ({
          id: conv.id,
          title: conv.title,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          messages: conv.messages?.map(msg => ({
            id: msg.id,
            content: msg.content,
            isUser: msg.isUser,
            aiModel: msg.aiModel,
            createdAt: msg.createdAt,
          })) || [],
        })),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat_history_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast.success(`Exported ${selectedConversations.size} conversation(s)`);
    } catch (error) {
      console.error("Error exporting conversations:", error);
      showToast.error("Failed to export conversations");
    } finally {
      setExporting(false);
    }
  };

  const isAllSelected = selectedConversations.size === conversations.length && conversations.length > 0;
  const isIndeterminate = selectedConversations.size > 0 && selectedConversations.size < conversations.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading chat history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Message History
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Save your history as JSON or delete it.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Chat History</h3>
              <p className="text-muted-foreground">
                You haven't started any conversations yet. Start chatting to see your history here.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    ref={(el) => {
                      if (el?.dataset) {
                        (el as any).indeterminate = isIndeterminate;
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">
                    Select All ({selectedConversations.size} selected)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportSelected}
                    disabled={selectedConversations.size === 0 || exporting}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {exporting ? "Exporting..." : "Export"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteSelected}
                    disabled={selectedConversations.size === 0 || deleting}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Messages</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversations.map((conversation) => (
                      <TableRow key={conversation.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedConversations.has(conversation.id)}
                            onCheckedChange={(checked) =>
                              handleSelectConversation(conversation.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {conversation.title}
                        </TableCell>
                        <TableCell>
                          {new Date(conversation.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(conversation.updatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {conversation._count?.messages || 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <p className="text-sm text-muted-foreground">
            Permanently delete your history from our servers.
          </p>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={deleting || conversations.length === 0}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Chat History
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete All Chat History</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all your
                  conversations and messages from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive hover:bg-destructive/90">
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}; 