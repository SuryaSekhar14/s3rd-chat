import { makeAutoObservable, runInAction } from "mobx";

import { ChatModel } from "@/models/ChatModel";
import { ChatMessageJSON } from "@/models/ChatMessageModel";
import { ApiMessage } from "@/lib/types";

import showToast from "@/lib/toast";
import { defaultModel } from "@/lib/config";

// Database interface - only what ChatViewModel needs
interface DatabaseMethods {
  getSpecificConversation?: (conversationId: string) => Promise<any | null>;
  saveMessagesToDatabase?: (
    conversationId: string,
    messages: ChatMessageJSON[],
  ) => Promise<boolean>;
  isUserLoaded?: boolean;
  userId?: string;
}

interface SidebarViewModelRef {
  revalidateChatSummaries?: () => void;
}

export class ChatViewModel {
  // Chat state properties
  private _activeChat: ChatModel | null = null;
  private activeChatId: string | null = null;
  private isInitialized: boolean = false;
  private isGenerating: boolean = false;
  private selectedPersonaKey: string = "none";

  // Title editing state
  private isTitleEditing: boolean = false;
  private editedTitle: string = "";
  private isGeneratingTitle: boolean = false;

  // Input state properties
  private isEnhancing: boolean = false;

  // Database methods (injected)
  private databaseMethods: DatabaseMethods = {};
  private sidebarViewModel: SidebarViewModelRef = {};

  constructor() {
    makeAutoObservable(this);
    this.init();
  }

  // Inject database methods
  setDatabaseMethods = (methods: DatabaseMethods) => {
    this.databaseMethods = methods;
  };

  setSidebarViewModel = (sidebarRef: SidebarViewModelRef) => {
    this.sidebarViewModel = sidebarRef;
  };

  // ========== CHAT STATE GETTERS ==========

  get activeChat(): ChatModel | null {
    return this._activeChat;
  }

  get generating(): boolean {
    return this.isGenerating;
  }

  get selectedPersona(): string {
    return this.selectedPersonaKey;
  }

  get isNewChatDisabled(): boolean {
    // On home page, always allow new chat creation
    if (typeof window !== "undefined" && window.location.pathname === "/") {
      return false;
    }
    return this.activeChat?.messages.length == 0;
  }

  get titleEditing(): boolean {
    return this.isTitleEditing;
  }

  get currentEditedTitle(): string {
    return this.editedTitle;
  }

  get titleGenerating(): boolean {
    return this.isGeneratingTitle;
  }

  get enhancing(): boolean {
    return this.isEnhancing;
  }

  get initialized(): boolean {
    return this.isInitialized;
  }

  // ========== HELPER METHODS ==========

  private ensureStringContent(
    content: string | object | null | undefined,
  ): string {
    if (content === null || content === undefined) {
      return "";
    }
    if (typeof content === "string") {
      return content;
    }
    try {
      return JSON.stringify(content);
    } catch (error) {
      console.warn("[ChatViewModel] Failed to stringify content:", error);
      return String(content);
    }
  }

  setSelectedPersona(personaKey: string) {
    this.selectedPersonaKey = personaKey;
  }

  // ========== INITIALIZATION ==========

  init = async () => {
    console.log("[ChatViewModel] Initializing...");

    if (typeof window === "undefined") {
      // SSR - create initial empty state
      this.isInitialized = true;
      return;
    }

    this.isInitialized = true;
    console.log("[ChatViewModel] Initialization complete");
  };

  // ========== CHAT OPERATIONS ==========

  // Wait for database methods to be ready
  private waitForDatabaseMethods = async (
    timeoutMs: number = 5000,
  ): Promise<boolean> => {
    const startTime = Date.now();

    console.log("[ChatViewModel] Waiting for database methods...");
    console.log("[ChatViewModel] Current state:", {
      hasGetSpecificConversation:
        !!this.databaseMethods.getSpecificConversation,
      isUserLoaded: this.databaseMethods.isUserLoaded,
      userId: this.databaseMethods.userId,
    });

    while (Date.now() - startTime < timeoutMs) {
      if (
        this.databaseMethods.getSpecificConversation &&
        this.databaseMethods.isUserLoaded &&
        this.databaseMethods.userId
      ) {
        console.log("[ChatViewModel] Database methods ready!");
        return true;
      }

      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    console.log("[ChatViewModel] Timeout waiting for database methods");
    return false;
  };

  // Method to directly load a specific chat by ID (for direct URL access)
  loadSpecificChat = async (chatId: string): Promise<boolean> => {
    console.log("[ChatViewModel] loadSpecificChat called for:", chatId);

    // Wait for database methods to be ready
    const methodsReady = await this.waitForDatabaseMethods();
    if (!methodsReady) {
      console.log("[ChatViewModel] Database methods not ready after timeout");
      return false;
    }

    console.log(
      "[ChatViewModel] Database methods ready, proceeding with chat load",
    );

    try {
      const conversation =
        await this.databaseMethods.getSpecificConversation!(chatId);

      if (!conversation) {
        console.log("[ChatViewModel] Chat not found:", chatId);
        return false;
      }

      console.log(
        "[ChatViewModel] Loading specific chat:",
        chatId,
        "with",
        conversation.messages?.length ?? 0,
        "messages",
      );

      // Load the specific chat data
      this.loadActiveChatFromDatabase(chatId, conversation);

      runInAction(() => {
        this.activeChatId = chatId;
      });

      return true;
    } catch (error) {
      console.error("Error loading specific chat:", error);
      return false;
    }
  };

  // Load active chat with messages from database data
  private readonly loadActiveChatFromDatabase = (
    chatId: string,
    dbConversation: any,
  ): void => {
    try {
      // Convert messages from database format
      const dbMessages = (dbConversation.messages ?? []) as Array<{
        content: string;
        isUser: boolean;
        aiModel?: string;
        promptTokens?: number;
        completionTokens?: number;
        attachments?: any; // Could be string or array
      }>;
      console.log(
        "[ChatViewModel] Raw database messages:",
        dbMessages.map((msg) => ({
          content: msg.content,
          isUser: msg.isUser,
          contentType: typeof msg.content,
          isEmpty: !msg.content || !msg.content.trim(),
          hasAttachments: !!msg.attachments,
          attachmentsType: typeof msg.attachments,
        })),
      );

      const chatMessages = dbMessages.map((msg) => {
        let attachments: any[] = [];
        if (msg.attachments) {
          if (typeof msg.attachments === 'string') {
            try {
              attachments = JSON.parse(msg.attachments);
            } catch {
              attachments = [];
            }
          } else if (Array.isArray(msg.attachments)) {
            attachments = msg.attachments;
          } else if (typeof msg.attachments === 'object') {
            attachments = [msg.attachments];
          }
        }
        return {
          content: msg.content,
          isUser: msg.isUser,
          aiModel: msg.aiModel,
          promptTokens: msg.promptTokens,
          completionTokens: msg.completionTokens,
          attachments,
        };
      });

      this._activeChat = {
        id: chatId,
        messages: chatMessages,
        // ...other properties as before
        ...dbConversation,
      };
      
    } catch (err) {
      console.error("[ChatViewModel] Error loading chat from DB:", err);
    }
  };

  setActiveChat = (chatModel: ChatModel) => {
    runInAction(() => {
      this._activeChat = chatModel;
      this.activeChatId = chatModel.id;
    });
  };

  clearActiveChat = () => {
    runInAction(() => {
      this._activeChat = null;
      this.activeChatId = null;
    });
  };

  addMessageToActiveChat = async (
    content: string | object,
    isUser: boolean,
    attachments?: Array<{ type: string; url: string; filename?: string }>,
  ) => {
    console.log(
      "[ChatViewModel] Adding message to active chat, isUser:",
      isUser,
      "attachments:", attachments
    );
    if (!this._activeChat) {
      console.log("[ChatViewModel] No active chat available");
      return false;
    }

    const chatId = this._activeChat.id;
    const safeContent = this.ensureStringContent(content);

    // Add message to chat model with attachments
    this._activeChat.addMessage(safeContent, isUser, attachments);

    // Save to database
    if (this.databaseMethods.saveMessagesToDatabase) {
      try {
        const messages = this._activeChat.messages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          isUser: msg.isUser,
          attachments: msg.attachments,
        }));

        const success = await this.databaseMethods.saveMessagesToDatabase(
          chatId,
          messages,
        );
        if (!success) {
          console.error("Failed to save messages to database");
          return false;
        }
      } catch (error) {
        console.error("Error saving messages:", error);
        return false;
      }
    }

    return true;
  };

  updateChatTitle = async (id: string, title: string): Promise<boolean> => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      showToast.error("Title cannot be empty");
      return false;
    }

    try {
      // First update the database
      const response = await fetch("/api/conversations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: id,
          title: trimmedTitle,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update title in database");
      }

      // Then update the local state
      runInAction(() => {
        // Update active chat if it's the one being updated
        if (id === this.activeChatId && this._activeChat) {
          this._activeChat.updateTitle(trimmedTitle);
        }
      });

      // Trigger sidebar revalidation to update the chat list
      if (this.sidebarViewModel.revalidateChatSummaries) {
        this.sidebarViewModel.revalidateChatSummaries();
      }

      showToast.success("Title updated");
      return true;
    } catch (error) {
      console.error("Error updating title:", error);
      showToast.error("Failed to update title");
      return false;
    }
  };

  setIsGenerating = (isGenerating: boolean) => {
    this.isGenerating = isGenerating;
  };

  setIsEnhancing = (isEnhancing: boolean) => {
    this.isEnhancing = isEnhancing;
  };

  // generateChatTitle = async (id: string) => {
  //   if (id !== this.activeChatId || !this._activeChat) return false;

  //   if (this._activeChat.messages.length === 0) {
  //     showToast.error("Chat needs messages to generate a name");
  //     return false;
  //   }

  //   try {
  //     const apiMessages = this._activeChat.messages.map(
  //       (msg) =>
  //         new ApiMessageModel(msg.isUser ? "user" : "assistant", msg.content),
  //     );

  //     const response = await fetch("/api/chat-name-suggestion", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         chatId: this._activeChat?.id,
  //         messages: apiMessages,
  //       }),
  //     });

  //     const data = await response.json();

  //     if (!response.ok) {
  //       // Handle API error responses using status code
  //       const statusCode = response.status;
  //       let errorMessage = "Failed to generate chat title";

  //       switch (statusCode) {
  //         case 429:
  //           errorMessage =
  //             "Rate limit reached. Please wait a moment before generating another chat name.";
  //           break;
  //         case 408:
  //           errorMessage =
  //             "Request timed out while generating chat name. Please try again.";
  //           break;
  //         case 503:
  //           errorMessage =
  //             "Service temporarily unavailable. Please try again later.";
  //           break;
  //       }

  //       showToast.error(errorMessage);
  //       return false;
  //     }

  //     if (data.name) {
  //       const success = await this.updateChatTitle(id, data.name);
  //       if (success) {
  //         return true;
  //       }
  //     }
  //     return false;
  //   } catch (error) {
  //     console.error("Error generating chat title:", error);
  //     showToast.error("Failed to generate chat title");
  //     return false;
  //   }
  // };

  // ========== TITLE EDITING ==========

  getTruncatedTitle = (title: string) => {
    return title.length > 40 ? title.substring(0, 40) + "..." : title;
  };

  startTitleEdit = () => {
    this.isTitleEditing = true;
    this.editedTitle = this._activeChat?.title || "";
  };

  cancelTitleEdit = () => {
    this.isTitleEditing = false;
    this.editedTitle = "";
  };

  saveTitleEdit = async () => {
    if (!this._activeChat) return;

    const success = await this.updateChatTitle(
      this._activeChat.id,
      this.editedTitle,
    );
    if (success) {
      this.isTitleEditing = false;
      this.editedTitle = "";
    }
  };

  setEditedTitle = (title: string) => {
    this.editedTitle = title;
  };

  // startGeneratingTitle = async () => {
  //   if (!this._activeChat) return;

  //   this.isGeneratingTitle = true;
  //   const success = await this.generateChatTitle(this._activeChat.id);
  //   this.isGeneratingTitle = false;
  //   return success;
  // };

  // ========== AI INTEGRATION ==========

  getModelFromLocalStorage = (): string => {
    if (typeof window === "undefined") {
      return defaultModel;
    }
    return localStorage.getItem("selectedModel") ?? defaultModel;
  };

  getAIMessagesFromActiveChat = () => {
    if (!this._activeChat) {
      return [];
    }
    const messages = this._activeChat.messages
      .filter((msg) => {
        const content = this.ensureStringContent(msg.content);
        return content && content.trim().length > 0;
      })
      .map((msg) => ({
        id: `${this._activeChat!.id}-${msg.id}`,
        role: msg.isUser ? ("user" as const) : ("assistant" as const),
        content: this.ensureStringContent(msg.content),
        promptTokens: msg.promptTokens,
        completionTokens: msg.completionTokens,
        attachments: msg.attachments ?? [],
      }));
    return messages;
  };

  formatAIMessages = (messages: ApiMessage[]) => {
    return messages.map((message, index) => {
      let attachments = (message as any).attachments ?? [];
      
      // Convert image data to attachments if present
      if ((message as any).data?.imageUrl && message.role === "user") {
        const imageUrl = (message as any).data.imageUrl;
        attachments = [
          ...attachments,
          {
            type: "image",
            url: imageUrl,
            filename: imageUrl.split("/").pop()?.split("?")[0] || "image"
          }
        ];
      }
      
      if ((message as any).data?.pdfUrl && message.role === "user") {
        const pdfUrl = (message as any).data.pdfUrl;
        const pdfFilename = (message as any).data.pdfFilename;
        attachments = [
          ...attachments,
          {
            type: "pdf",
            url: pdfUrl,
            filename: pdfFilename || pdfUrl.split("/").pop()?.split("?")[0] || "document.pdf"
          }
        ];
      }
      
      return {
        id: index,
        content: this.ensureStringContent(message.content),
        isUser: message.role === "user",
        promptTokens: (message as any).promptTokens,
        completionTokens: (message as any).completionTokens,
        attachments,
      };
    });
  };

  // saveMessagesToStorage = async (messages: ApiMessage[]) => {
  //   console.log("[ChatViewModel] Saving", messages.length, "messages to database");

  //   if (!this._activeChat) {
  //     console.log("[ChatViewModel] No active chat, cannot save messages");
  //     return false;
  //   }

  //   const formattedMessages = this.formatAIMessages(messages);

  //   // Update the active chat's messages in memory
  //   runInAction(() => {
  //     if (this._activeChat) {
  //       this._activeChat.replaceAllMessages(formattedMessages);
  //     }
  //   });

  //   // Save to database
  //   return await this.addMessageToActiveChat("", false); // This will save all messages
  // }

  enhancePrompt = async (input: string, setInput: (value: string) => void) => {
    if (!input.trim() || this.isGenerating || this.isEnhancing) return;

    if (!this.isInitialized) {
      console.log(
        "[ChatViewModel] Waiting for initialization before enhancing prompt",
      );
      await new Promise<void>((resolve) => {
        const checkInit = () => {
          if (this.isInitialized) {
            resolve();
          } else {
            setTimeout(checkInit, 100);
          }
        };
        checkInit();
      });
    }

    const currentChatId = this.activeChatId;

    if (!currentChatId) {
      console.log("[ChatViewModel] Cannot enhance prompt: No active chat");
      return;
    }

    try {
      this.setIsEnhancing(true);
      const response = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: currentChatId,
          prompt: input,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const statusCode = response.status;
        let errorMessage = "Failed to enhance prompt";

        switch (statusCode) {
          case 429:
            errorMessage =
              "Rate limit reached. Please wait a moment before enhancing again.";
            break;
          case 408:
            errorMessage =
              "Request timed out while enhancing prompt. Please try again.";
            break;
          case 503:
            errorMessage =
              "Service temporarily unavailable. Please try again later.";
            break;
        }

        showToast.error(errorMessage);
        return;
      }

      if (data.enhancedPrompt) {
        setInput(data.enhancedPrompt);
        showToast.success("Prompt enhanced!");
      }
    } catch (error) {
      console.error("Error enhancing prompt:", error);
      showToast.error("Failed to enhance prompt");
    } finally {
      this.setIsEnhancing(false);
    }
  };
}
