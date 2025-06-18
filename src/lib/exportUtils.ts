import showToast from "@/lib/toast";
import type { ChatModel } from "@/models/ChatModel";

export const handleExportConversation = async (
  chatId: string,
  chatTitle: string,
  loadSpecificChat: (id: string) => Promise<boolean>,
  getActiveChat: () => ChatModel | null,
): Promise<void> => {
  try {
    // Load the chat to get its messages
    const success = await loadSpecificChat(chatId);
    if (!success) {
      showToast.error("Failed to load chat for export");
      return;
    }

    const activeChat = getActiveChat();
    if (!activeChat || activeChat.messages.length === 0) {
      showToast.error("No messages to export");
      return;
    }

    // Create markdown content
    const timestamp = new Date().toISOString().split("T")[0];
    let markdown = `# ${chatTitle}\n\n`;
    markdown += `**Exported on:** ${timestamp}\n\n`;
    markdown += `---\n\n`;

    // Add each message
    activeChat.messages.forEach((message, index) => {
      const role = message.isUser ? "👤 **You:**" : "🤖 **AI:**";
      markdown += `${role}\n\n${message.content}\n\n`;

      // Add separator between messages (except for the last one)
      if (index < activeChat.messages.length - 1) {
        markdown += `---\n\n`;
      }
    });

    // Create and download the file
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${chatTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${timestamp}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast.success("Conversation exported successfully");
  } catch (error) {
    console.error("Error exporting conversation:", error);
    showToast.error("Failed to export conversation");
  }
};
