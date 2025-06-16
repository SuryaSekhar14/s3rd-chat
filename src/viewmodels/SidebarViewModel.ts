import { makeAutoObservable, runInAction } from 'mobx';

export interface ChatSummary {
  id: string;
  title: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastEditedAt: string;
  persona: string;
}

interface SidebarDatabaseMethods {
  getChatsFromDatabase?: () => Promise<any[] | null>;
  createConversationInDatabase?: (conversationId: string, title?: string) => Promise<boolean>;
  updateConversationInDatabase?: (conversationId: string, updates: { title?: string }) => Promise<boolean>;
  deleteConversationFromDatabase?: (conversationId: string) => Promise<boolean>;
  refreshConversations?: () => void;
  isUserLoaded?: boolean;
  userId?: string;
}

export class SidebarViewModel {
  private chatSummaries: ChatSummary[] = [];
  private activeChatId: string | null = null;
  private isInitialized: boolean = false;
  private isLoading: boolean = false;
  private databaseMethods: SidebarDatabaseMethods = {};

  constructor() {
    makeAutoObservable(this);
    this.init();
  }

  // Inject database methods
  setDatabaseMethods = (methods: SidebarDatabaseMethods) => {
    this.databaseMethods = methods;
  }

  get allChatSummaries(): ChatSummary[] {
    return [...this.chatSummaries];
  }

  get initialized(): boolean {
    return this.isInitialized;
  }

  get loading(): boolean {
    return this.isLoading;
  }

  setActiveChatId = (chatId: string | null) => {
    runInAction(() => {
      this.activeChatId = chatId;
      // Update active status in summaries
      this.chatSummaries.forEach(summary => {
        summary.active = summary.id === chatId;
      });
    });
  }

  // Load conversations from database
  private readonly loadFromDatabase = async (): Promise<void> => {
    if (!this.databaseMethods.getChatsFromDatabase || !this.databaseMethods.isUserLoaded || !this.databaseMethods.userId) {
      console.log("[SidebarViewModel] Cannot load from database - user not loaded or methods not available");
      return;
    }

    runInAction(() => {
      this.isLoading = true;
    });

    try {
      const dbConversations = await this.databaseMethods.getChatsFromDatabase();
      console.log("[SidebarViewModel] Loaded conversations from database:", dbConversations?.length ?? 0);
      
      if (dbConversations && dbConversations.length > 0) {
        // Convert database conversations to chat summaries
        const summaries: ChatSummary[] = dbConversations.map((conv) => ({
          id: conv.id,
          title: conv.title,
          active: conv.id === this.activeChatId,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          lastEditedAt: conv.updatedAt,
          persona: 'none'
        }));
        
        runInAction(() => {
          this.chatSummaries = summaries;
          this.isLoading = false;
        });
        
        console.log("[SidebarViewModel] Loaded", summaries.length, "conversations from database");
      } else {
        console.log("[SidebarViewModel] No conversations found in database");
        runInAction(() => {
          this.chatSummaries = [];
          this.isLoading = false;
        });
      }
    } catch (error) {
      console.error("Error loading from database:", error);
      runInAction(() => {
        this.chatSummaries = [];
        this.isLoading = false;
      });
    }
  }

  init = async () => {
    console.log("[SidebarViewModel] Initializing...");
    
    if (typeof window === 'undefined') {
      this.isInitialized = true;
      return;
    }

    // Don't wait for user authentication here - let syncOnAuthentication handle it
    this.isInitialized = true;
    console.log("[SidebarViewModel] Initialization complete");
  }

  // Trigger reload when user becomes authenticated
  syncOnAuthentication = async (): Promise<void> => {
    if (this.databaseMethods.isUserLoaded && this.databaseMethods.userId) {
      console.log("[SidebarViewModel] User authenticated, loading from database");
      this.loadFromDatabase();
    }
  }

  // Revalidate chat summaries using SWR
  revalidateChatSummaries = (): void => {
    if (this.databaseMethods.refreshConversations) {
      console.log("[SidebarViewModel] Revalidating conversations using SWR");
      this.databaseMethods.refreshConversations();
    }
  }

  createNewChat = async (): Promise<{ success: boolean; chatId?: string }> => {
    const newChatId = crypto.randomUUID();
    
    try {
      // Create in database first
      if (this.databaseMethods.createConversationInDatabase) {
        const success = await this.databaseMethods.createConversationInDatabase(
          newChatId,
          "New Chat"
        );
        
        if (!success) {
          return { success: false };
        }
      }

      // Add to local summaries
      runInAction(() => {
        // Update active status in summaries
        this.chatSummaries.forEach(summary => {
          summary.active = false;
        });
        
        const summary: ChatSummary = {
          id: newChatId,
          title: "New Chat",
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastEditedAt: new Date().toISOString(),
          persona: 'none'
        };
        
        this.chatSummaries.unshift(summary);
        this.activeChatId = newChatId;
      });

      return { success: true, chatId: newChatId };
    } catch (error) {
      console.error("Error creating new chat:", error);
      return { success: false };
    }
  }

  deleteChat = async (id: string): Promise<boolean> => {
    try {
      // Delete from database first
      if (this.databaseMethods.deleteConversationFromDatabase) {
        const success = await this.databaseMethods.deleteConversationFromDatabase(id);
        
        if (!success) {
          return false;
        }
      }

      runInAction(() => {
        // Remove from summaries
        const updatedSummaries = this.chatSummaries.filter(summary => summary.id !== id);
        
        // If we're deleting the active chat, clear active state
        if (this.activeChatId === id) {
          this.activeChatId = null;
        }
        
        this.chatSummaries = updatedSummaries;
      });

      return true;
    } catch (error) {
      console.error("Error deleting chat:", error);
      return false;
    }
  }

  updateChatTitle = async (id: string, title: string): Promise<boolean> => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return false;
    }

    try {
      // Update in database first
      if (this.databaseMethods.updateConversationInDatabase) {
        const success = await this.databaseMethods.updateConversationInDatabase(id, { title: trimmedTitle });
        
        if (!success) {
          return false;
        }
      }

      runInAction(() => {
        // Update summary
        const summaryIndex = this.chatSummaries.findIndex(summary => summary.id === id);
        if (summaryIndex >= 0) {
          this.chatSummaries[summaryIndex] = {
            ...this.chatSummaries[summaryIndex],
            title: trimmedTitle
          };
        }
      });

      return true;
    } catch (error) {
      console.error("Error updating title:", error);
      return false;
    }
  }

  // Add a chat to summaries (called when a chat is loaded directly)
  addChatToSummaries = (conversation: any) => {
    runInAction(() => {
      const existingSummary = this.chatSummaries.find(summary => summary.id === conversation.id);
      if (!existingSummary) {
        const summary: ChatSummary = {
          id: conversation.id,
          title: conversation.title,
          active: conversation.id === this.activeChatId,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          lastEditedAt: conversation.updatedAt,
          persona: conversation.persona ?? 'none'
        };
        
        this.chatSummaries.unshift(summary);
      }
    });
  }
} 