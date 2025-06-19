import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/database";

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

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const allMessages = await prisma.message.findMany({
      where: {
        conversation: {
          userId: user.id,
        },
      },
      include: {
        conversation: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const messagesWithAttachments = allMessages.filter(message => 
      message.attachments && 
      Array.isArray(message.attachments) && 
      (message.attachments as any[]).length > 0
    );

    const attachments: AttachmentWithContext[] = [];
    
    messagesWithAttachments.forEach((message) => {
      if (message.attachments && Array.isArray(message.attachments)) {
        (message.attachments as any[]).forEach((attachment) => {
          attachments.push({
            id: `${message.id}_${attachment.url}`, // Create unique ID
            type: attachment.type,
            url: attachment.url,
            filename: attachment.filename,
            messageId: message.id,
            conversationId: message.conversationId,
            conversationTitle: message.conversation.title,
            createdAt: message.createdAt.toISOString(),
            messageContent: message.content.slice(0, 100) + (message.content.length > 100 ? '...' : ''),
          });
        });
      }
    });

    return NextResponse.json({ attachments });
  } catch (error) {
    console.error("Error fetching user attachments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
} 