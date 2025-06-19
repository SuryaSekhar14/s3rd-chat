import posthog from "posthog-js";

/**
 * PostHog Analytics Integration for S3RD Chat
 * 
 * This file contains comprehensive analytics tracking for the chat application.
 * Events are tracked across all major user interactions and features:
 * 
 * IMPLEMENTED TRACKING:
 * ✅ Chat Management: Creation, deletion, pinning, title updates, exports
 * ✅ Message Events: Sending, receiving, with content analysis
 * ✅ File Uploads: Images and PDFs via drag, click, or paste
 * ✅ Model Selection: AI model changes and configurations
 * ✅ User Authentication: Sign in/out events with session tracking
 * ✅ UI Interactions: Sidebar toggle, theme changes, search usage
 * ✅ Keyboard Shortcuts: All hotkey usage with context
 * ✅ Preview Mode: Unauthenticated user interactions and limits
 * ✅ Error Tracking: API errors, upload failures, with context
 * ✅ Settings: Dialog opens, persona selection
 * ✅ Page Views: Automatic tracking with load times
 * ✅ Session Management: User identification and session context
 * 
 * All events include enriched context like screen size, user agent, timestamps,
 * session information, and relevant business metrics.
 */

// Analytics Events Enum - Following the workspace rule for feature flags and custom properties
export const ANALYTICS_EVENTS = {
  // Chat Events
  CHAT_CREATED: "chat_created",
  CHAT_MESSAGE_SENT: "chat_message_sent", 
  CHAT_MESSAGE_RECEIVED: "chat_message_received",
  CHAT_DELETED: "chat_deleted",
  CHAT_EXPORTED: "chat_exported",
  CHAT_PINNED: "chat_pinned",
  CHAT_UNPINNED: "chat_unpinned",
  CHAT_TITLE_UPDATED: "chat_title_updated",
  CHAT_TITLE_GENERATED: "chat_title_generated",
  CHAT_SEARCHED: "chat_searched",
  
  // Model Events
  MODEL_CHANGED: "model_changed",
  MODEL_API_KEY_UPDATED: "model_api_key_updated",
  MODEL_API_KEY_TESTED: "model_api_key_tested",
  
  // File Upload Events
  IMAGE_UPLOADED: "image_uploaded",
  IMAGE_UPLOAD_FAILED: "image_upload_failed",
  IMAGE_REMOVED: "image_removed",
  PDF_UPLOADED: "pdf_uploaded", 
  PDF_UPLOAD_FAILED: "pdf_upload_failed",
  PDF_REMOVED: "pdf_removed",
  FILE_PASTED: "file_pasted",
  
  // Preview Mode Events
  PREVIEW_MODE_ENTERED: "preview_mode_entered",
  PREVIEW_LIMIT_REACHED: "preview_limit_reached",
  PREVIEW_UPGRADE_PROMPT_SHOWN: "preview_upgrade_prompt_shown",
  
  // User Events
  USER_SIGNED_IN: "user_signed_in",
  USER_SIGNED_OUT: "user_signed_out",
  USER_PROFILE_VIEWED: "user_profile_viewed",
  
  // UI Events
  SIDEBAR_COLLAPSED: "sidebar_collapsed",
  SIDEBAR_EXPANDED: "sidebar_expanded", 
  THEME_CHANGED: "theme_changed",
  KEYBOARD_SHORTCUT_USED: "keyboard_shortcut_used",
  SETTINGS_OPENED: "settings_opened",
  HELP_OPENED: "help_opened",
  
  // Error Events
  ERROR_OCCURRED: "error_occurred",
  API_ERROR: "api_error",
  NETWORK_ERROR: "network_error",
  
  // Persona Events
  PERSONA_SELECTED: "persona_selected",
  
  // Performance Events
  PAGE_LOADED: "page_loaded",
  CHAT_LOADED: "chat_loaded",
} as const;

// Custom Properties Enum - Following the workspace rule for custom properties
export const ANALYTICS_PROPERTIES = {
  // Chat Properties
  CHAT_ID: "chat_id",
  CHAT_TITLE: "chat_title", 
  MESSAGE_COUNT: "message_count",
  MESSAGE_LENGTH: "message_length",
  RESPONSE_TIME: "response_time",
  HAS_ATTACHMENTS: "has_attachments",
  IS_PREVIEW_MODE: "is_preview_mode",
  
  // Model Properties
  MODEL_ID: "model_id",
  MODEL_NAME: "model_name",
  MODEL_PROVIDER: "model_provider",
  
  // File Properties
  FILE_TYPE: "file_type",
  FILE_SIZE: "file_size",
  FILE_NAME: "file_name",
  UPLOAD_METHOD: "upload_method", // drag, paste, click
  
  // UI Properties
  THEME: "theme",
  SCREEN_SIZE: "screen_size",
  SHORTCUT_KEY: "shortcut_key",
  
  // Error Properties
  ERROR_TYPE: "error_type",
  ERROR_MESSAGE: "error_message",
  ERROR_STACK: "error_stack",
  STATUS_CODE: "status_code",
  
  // Performance Properties
  LOAD_TIME: "load_time",
  PAGE_PATH: "page_path",
  
  // Engagement Properties
  SESSION_LENGTH: "session_length",
  CHATS_IN_SESSION: "chats_in_session",
} as const;

export class Analytics {
  private static instance: Analytics;
  private sessionStartTime: number;
  private chatsCreatedThisSession: number = 0;

  private constructor() {
    this.sessionStartTime = Date.now();
  }

  public static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  // Helper method to track events with validation
  track(event: string, properties?: Record<string, any>): void {
    if (typeof window === 'undefined') {
      return; // Don't track on server-side
    }

    try {
      // Add session context to all events
      const enrichedProperties = {
        ...properties,
        session_id: this.getSessionId(),
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
      };

      posthog.capture(event, enrichedProperties);
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  // Helper method to identify users
  identify(userId: string, traits?: Record<string, any>): void {
    if (typeof window === 'undefined') return;
    
    try {
      posthog.identify(userId, traits);
    } catch (error) {
      console.error('Analytics identify error:', error);
    }
  }

  // Helper method to track page views
  trackPageView(path: string): void {
    this.track(ANALYTICS_EVENTS.PAGE_LOADED, {
      [ANALYTICS_PROPERTIES.PAGE_PATH]: path,
      [ANALYTICS_PROPERTIES.LOAD_TIME]: performance.now(),
    });
  }

  // Helper method to track chat creation
  trackChatCreated(chatId: string, isPreviewMode: boolean = false): void {
    this.chatsCreatedThisSession++;
    this.track(ANALYTICS_EVENTS.CHAT_CREATED, {
      [ANALYTICS_PROPERTIES.CHAT_ID]: chatId,
      [ANALYTICS_PROPERTIES.IS_PREVIEW_MODE]: isPreviewMode,
      [ANALYTICS_PROPERTIES.CHATS_IN_SESSION]: this.chatsCreatedThisSession,
    });
  }

  // Helper method to track messages
  trackMessageSent(
    chatId: string, 
    messageLength: number, 
    hasAttachments: boolean,
    modelId: string,
    isPreviewMode: boolean = false
  ): void {
    this.track(ANALYTICS_EVENTS.CHAT_MESSAGE_SENT, {
      [ANALYTICS_PROPERTIES.CHAT_ID]: chatId,
      [ANALYTICS_PROPERTIES.MESSAGE_LENGTH]: messageLength,
      [ANALYTICS_PROPERTIES.HAS_ATTACHMENTS]: hasAttachments,
      [ANALYTICS_PROPERTIES.MODEL_ID]: modelId,
      [ANALYTICS_PROPERTIES.IS_PREVIEW_MODE]: isPreviewMode,
    });
  }

  // Helper method to track file uploads
  trackFileUpload(
    fileType: 'image' | 'pdf',
    fileName: string,
    fileSize: number,
    uploadMethod: 'drag' | 'paste' | 'click',
    success: boolean
  ): void {
    const event = success 
      ? (fileType === 'image' ? ANALYTICS_EVENTS.IMAGE_UPLOADED : ANALYTICS_EVENTS.PDF_UPLOADED)
      : (fileType === 'image' ? ANALYTICS_EVENTS.IMAGE_UPLOAD_FAILED : ANALYTICS_EVENTS.PDF_UPLOAD_FAILED);

    this.track(event, {
      [ANALYTICS_PROPERTIES.FILE_TYPE]: fileType,
      [ANALYTICS_PROPERTIES.FILE_NAME]: fileName,
      [ANALYTICS_PROPERTIES.FILE_SIZE]: fileSize,
      [ANALYTICS_PROPERTIES.UPLOAD_METHOD]: uploadMethod,
    });
  }

  // Helper method to track errors
  trackError(
    errorType: string,
    errorMessage: string,
    errorStack?: string,
    statusCode?: number
  ): void {
    this.track(ANALYTICS_EVENTS.ERROR_OCCURRED, {
      [ANALYTICS_PROPERTIES.ERROR_TYPE]: errorType,
      [ANALYTICS_PROPERTIES.ERROR_MESSAGE]: errorMessage,
      [ANALYTICS_PROPERTIES.ERROR_STACK]: errorStack,
      [ANALYTICS_PROPERTIES.STATUS_CODE]: statusCode,
    });
  }

  // Get session information
  private getSessionId(): string {
    // Use posthog's session ID if available, otherwise generate one
    return posthog.get_session_id() || `session_${this.sessionStartTime}`;
  }

  // Calculate session length
  getSessionLength(): number {
    return Date.now() - this.sessionStartTime;
  }
}

// Export singleton instance
export const analytics = Analytics.getInstance(); 