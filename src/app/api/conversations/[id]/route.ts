import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DatabaseService } from "@/lib/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    
    const url = new URL(request.url);
    const recentOnly = url.searchParams.get("recent") === "true";
    const limit = parseInt(url.searchParams.get("limit") || "50");

    let conversation;
    
    if (recentOnly) {
      conversation = await DatabaseService.getConversationWithRecentMessages(
        conversationId,
        limit
      );
    } else {
      conversation = await DatabaseService.getConversationOptimized(conversationId);
    }

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    const user = await DatabaseService.getOrCreateUser(userId);
    if (conversation.userId !== user.id) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
