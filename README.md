# Renben Chat

A sophisticated real-time AI chatbot application built with Next.js 15, MobX state management, and the Vercel AI SDK, following the MVVM (Model-View-ViewModel) architecture pattern.

## Overview

Renben Chat provides a modern, responsive interface for interacting with OpenAI's advanced language models. The application features real-time message streaming, chat history management, model selection, persona-based prompting, and a beautiful UI built with shadcn/ui components.

## Features

- **Real-time AI Chat**: OpenAI's GPT models with streaming responses through Vercel AI SDK
- **MVVM Architecture**: Clean separation of concerns between data, business logic, and UI
- **Reactive UI**: MobX-powered state management for efficient UI updates
- **Chat History**: Persistent chats with automatic title generation based on content
- **Multiple Personas**: Customizable AI personas with specialized knowledge domains
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Theme Support**: Dark and light mode with automatic system preference detection
- **Markdown Support**: Rich text formatting with code syntax highlighting
- **Command Palette**: Quick actions and navigations with keyboard shortcuts
- **Model Selection**: Support for different OpenAI models with configuration
- **Prompt Enhancement**: AI-powered prompt improvement suggestions
- **Performance Optimized**: Efficient rendering and state management

## Implementation Details

### Core Architecture

1. **MVVM Pattern Implementation**
   - Models: Pure data classes with minimal logic (ChatModel, ChatMessageModel, ApiMessageModel)
   - ViewModels: Business logic and state management (ChatViewModel, RootViewModel)
   - Views: React components that observe and render ViewModel state
   - Strict separation of concerns with unidirectional data flow

2. **State Management**
   - MobX for reactive state management
   - RootViewModel singleton pattern for global state access
   - ViewModelProvider context for dependency injection
   - Automatic state persistence with localStorage
   - Computed properties for derived state

3. **Data Models**
   - ChatModel: Manages individual chat sessions and messages
   - ChatMessageModel: Represents user and assistant messages
   - ApiMessageModel: Handles API message format conversion
   - Serialization support for persistence
   - Type-safe model transformations

4. **API Integration**
   - Edge Runtime for optimal performance
   - Three main endpoints:
     - /api/chat: Streaming chat completion with persona support
     - /api/chat-name-suggestion: Automatic chat title generation
     - /api/enhance-prompt: AI-powered prompt enhancement
   - Error handling and response normalization
   - Authentication middleware support

5. **Real-time Features**
   - Streaming responses using Vercel AI SDK
   - Message queue management
   - Typing indicators
   - Progress tracking
   - Error recovery mechanisms

6. **Persistence Layer**
   - Local storage for chat history
   - Model preferences
   - Theme settings
   - Persona configurations
   - Session management

7. **UI Components**
   - Atomic design pattern
   - Composition-based component architecture
   - Responsive layouts
   - Accessibility-first approach
   - Theme system integration

8. **Performance Optimizations**
   - Selective rendering with MobX observers
   - Virtual scrolling for message lists
   - Lazy loading of components
   - Edge runtime for API routes
   - Optimistic updates
   - Debounced persistence

9. **Security Features**
   - API key management
   - Request validation
   - Rate limiting
   - Input sanitization
   - Secure storage practices

10. **Error Handling**
    - Graceful degradation
    - Error boundaries
    - Toast notifications
    - Retry mechanisms
    - Fallback states

## Tech Stack

- **Frontend Framework**: Next.js 15 with App Router
- **State Management**: MobX with React hooks
- **UI Framework**: Tailwind CSS 4 with shadcn/ui components
- **AI Integration**: Vercel AI SDK + OpenAI SDK
- **Typing**: TypeScript 5.x with strict type checking
- **Storage**: Client-side persistence with localStorage
- **Markdown**: react-markdown with rehype plugins
- **Notifications**: react-hot-toast for user feedback
- **Theming**: next-themes for light/dark mode
- **Icons**: Lucide React and custom SVG components
- **Development**: Fast refresh with Turbopack

## Getting Started

First, clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/renben-chat.git
cd renben-chat
npm install
```

Create a `.env.local` file with your API keys:

```bash
# OpenAI API Key (Required)
OPENAI_API_KEY=your_openai_api_key

# Optional configuration
AI_SDK_RUNTIME=30  # Controls time limit for API execution
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Main entry page
│   ├── providers.tsx             # Context providers
│   ├── layout.tsx                # Root layout with metadata
│   ├── globals.css               # Global styles
│   └── api/                      # API Routes
│       ├── chat/                 # Main chat API endpoint
│       ├── chat-name-suggestion/ # Title generation API
│       └── enhance-prompt/       # Prompt enhancement API
├── components/                   # React Components (Views)
│   ├── Chat.tsx                  # Main chat container
│   ├── ChatHeader.tsx            # Chat header with actions
│   ├── ChatInput.tsx             # Message input component
│   ├── MainLayout.tsx            # App layout structure
│   ├── Message.tsx               # Message display component
│   ├── MessageList.tsx           # List of messages
│   ├── SettingsDialog.tsx        # Settings modal
│   ├── Sidebar.tsx               # Navigation sidebar
│   ├── ThemeToggle.tsx           # Dark/light mode toggle
│   ├── icons/                    # SVG icon components
│   └── ui/                       # Shared UI components
├── hooks/                        # Custom React hooks
│   ├── useModel.ts               # Model selection hook
│   ├── useOperatingSystem.ts     # OS detection for shortcuts
│   ├── useScreenSize.ts          # Responsive design hook
│   └── useViewModel.ts           # ViewModel access hooks
├── lib/                          # Utilities and helpers
│   ├── config.ts                 # App configuration
│   ├── prompts.ts                # System prompts
│   ├── toast.ts                  # Toast notification utility
│   ├── types.ts                  # Shared TypeScript types
│   ├── utils.ts                  # Utility functions
│   ├── utils/                    # More utilities
│   └── stores/                   # Legacy stores (being migrated)
├── models/                       # Data Models
│   ├── ApiMessageModel.ts        # API message format
│   ├── ChatMessageModel.ts       # Chat message model
│   └── ChatModel.ts              # Chat model with messages
└── viewmodels/                   # ViewModels (Business Logic)
    ├── ChatViewModel.ts          # Chat business logic
    ├── RootViewModel.ts          # Root ViewModel container
    └── ViewModelProvider.tsx     # ViewModel context provider
```

## Key Implementation Patterns

### 1. Singleton ViewModel Pattern

```typescript
// RootViewModel.ts - Singleton pattern implementation
export class RootViewModel {
  private static instance: RootViewModel;
  readonly chatViewModel: ChatViewModel;

  private constructor() {
    this.chatViewModel = new ChatViewModel();
  }

  static getInstance(): RootViewModel {
    if (!RootViewModel.instance) {
      RootViewModel.instance = new RootViewModel();
    }
    return RootViewModel.instance;
  }
}
```

### 2. Data Persistence Strategy

```typescript
// Example from ChatViewModel.ts
persistState = () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem("chats", JSON.stringify(this.chats));
  if (this.activeChatId) {
    localStorage.setItem("activeChat", this.activeChatId);
  }
}

// Load saved chats on initialization
init = async () => {
  if (typeof window === 'undefined') return;
  try {
    const savedChats = localStorage.getItem("chats");
    if (savedChats) {
      this.chats = JSON.parse(savedChats).map((chat: any) => 
        ChatModel.fromJSON(chat)
      );
      this.activeChatId = localStorage.getItem("activeChat") || this.chats[0]?.id;
    }
  } catch (error) {
    console.error("Error loading chats:", error);
    this.createInitialChat();
  }
}
```

### 3. API Integration

```typescript
// API route implementation
export async function POST(req: Request) {
  try {
    const { messages, model = defaultModel, persona = "none" } = await req.json();
    
    // Apply persona-specific system prompt if selected
    const systemPrompt = (persona !== "none" && persona in personaPrompts)
      ? defaultSystemPrompt + "\n\n" + personaPrompts[persona].prompt
      : defaultSystemPrompt;

    // Stream the text response using the AI SDK
    const result = streamText({
      model: openai(model),
      messages,
      system: systemPrompt,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

## Performance Optimizations

- **Selective Rendering**: MobX only updates components that depend on changed state
- **Virtualized Message Lists**: Only render visible messages for improved performance
- **Memoization**: Using React.memo for expensive components
- **Optimized Local Storage**: Only persist necessary data, debounced saves
- **Edge Runtime**: API routes use Edge Runtime for faster response times

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT](LICENSE)

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [MobX](https://mobx.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vercel AI SDK](https://sdk.vercel.ai/)
- [OpenAI](https://openai.com/)
- [React Hot Toast](https://react-hot-toast.com/)
- [React Markdown](https://github.com/remarkjs/react-markdown)
