"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  FileImage,
  FileText,
  Calendar,
  MessageSquare,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";
import showToast from "@/lib/toast";

interface AttachmentWithContext {
  id: string;
  type: string;
  url: string;
  filename?: string;
  messageId: string;
  conversationId: string;
  conversationTitle: string;
  createdAt: string;
  messageContent: string;
}

export function AttachmentsSettings() {
  const [attachments, setAttachments] = useState<AttachmentWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAttachments();
  }, []);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/user/attachments");
      
      if (!response.ok) {
        throw new Error("Failed to fetch attachments");
      }

      const data = await response.json();
      setAttachments(data.attachments || []);
    } catch (err) {
      console.error("Error fetching attachments:", err);
      setError("Failed to load attachments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (attachment: AttachmentWithContext) => {
    try {
      setDownloadingIds(prev => new Set(prev).add(attachment.id));
      
      const response = await fetch(attachment.url);
      
      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await response.blob();
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;
      a.download = attachment.filename || `attachment_${Date.now()}`;
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      
      showToast.success(`Downloaded ${attachment.filename || 'file'}`);
    } catch (err) {
      console.error("Error downloading file:", err);
      showToast.error("Failed to download file. Please try again.");
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(attachment.id);
        return newSet;
      });
    }
  };

  const handleViewInChat = (conversationId: string) => {
    window.open(`/chat/${conversationId}`, '_blank');
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <FileImage className="h-4 w-4" />;
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'image':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'pdf':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const groupAttachmentsByDate = (attachments: AttachmentWithContext[]) => {
    const groups: { [key: string]: AttachmentWithContext[] } = {};
    
    attachments.forEach(attachment => {
      const date = new Date(attachment.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(attachment);
    });
    
    return groups;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Attachments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading attachments...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Attachments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-center">
            <div className="space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchAttachments}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (attachments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Attachments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-center">
            <div className="space-y-4">
              <FileImage className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-medium">No attachments found</h3>
                <p className="text-sm text-muted-foreground">
                  Attachments you share in chats will appear here
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedAttachments = groupAttachmentsByDate(attachments);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="h-5 w-5" />
          Attachments
          <Badge variant="secondary" className="ml-auto">
            {attachments.length}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          View and download all attachments you&apos;ve shared in conversations
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {Object.entries(groupedAttachments)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, dateAttachments]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium text-sm">{date}</h3>
                  </div>
                  <div className="space-y-3 ml-6">
                    {dateAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="flex-shrink-0 mt-1">
                              {getFileIcon(attachment.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm truncate">
                                  {attachment.filename || 'Unnamed file'}
                                </p>
                                <Badge
                                  variant="secondary"
                                  className={`text-xs ${getFileTypeColor(attachment.type)}`}
                                >
                                  {attachment.type.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(attachment.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewInChat(attachment.conversationId)}
                              className="h-8 px-2"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(attachment)}
                              disabled={downloadingIds.has(attachment.id)}
                              className="h-8 px-2"
                            >
                              {downloadingIds.has(attachment.id) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Download className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            <span>From: {attachment.conversationTitle}</span>
                          </div>
                          {attachment.messageContent && (
                            <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                              {attachment.messageContent}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {Object.keys(groupedAttachments).indexOf(date) < Object.keys(groupedAttachments).length - 1 && (
                    <Separator className="mt-6" />
                  )}
                </div>
              ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 