import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DatabaseService } from "@/lib/database";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await DatabaseService.getUserConversationsWithMessages(userId);

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Error getting conversations for export:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await req.json();

    if (action === "deleteAll") {
      await DatabaseService.deleteAllUserConversations(userId);
      return NextResponse.json({ success: true });
    } else if (action === "export") {
      const conversations = await DatabaseService.getUserConversationsWithMessages(userId);
      return NextResponse.json({ conversations });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error with chat history operation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationIds } = await req.json();

    if (!conversationIds || !Array.isArray(conversationIds)) {
      return NextResponse.json(
        { error: "Conversation IDs array is required" },
        { status: 400 },
      );
    }

    for (const conversationId of conversationIds) {
      await DatabaseService.deleteConversation(conversationId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting conversations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
} 