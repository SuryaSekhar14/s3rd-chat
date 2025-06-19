# S3RD Chat

A real-time AI chatbot built with Next.js 15 that supports multiple AI providers including OpenAI, Anthropic, Google, and DeepSeek. Features user authentication, persistent chat history, and a modern responsive interface.

## Features

- Multiple AI providers (OpenAI GPT, Claude, Gemini, DeepSeek)
- Real-time message streaming
- User authentication with Clerk
- Persistent chat history in PostgreSQL
- Dark/light theme support
- Responsive design for all devices
- Chat management (create, rename, delete)
- AI model selection with capabilities

## Tech Stack

- Next.js 15 with App Router
- React 19 & TypeScript
- MobX for state management
- PostgreSQL with Prisma
- Clerk for authentication
- Vercel AI SDK
- Tailwind CSS with shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- AI provider API key (OpenAI, Anthropic, Google, or DeepSeek)

### Installation

```bash
git clone https://github.com/your-username/s3rd-chat.git
cd s3rd-chat
npm install
```

### Environment Setup

Create a `.env.local` file:

```bash
# Database
DATABASE_URL="your_postgresql_url"
DIRECT_URL="your_postgresql_direct_url"

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
CLERK_SECRET_KEY="your_clerk_secret_key"

# AI Providers (at least one required)
OPENAI_API_KEY="your_openai_key"
ANTHROPIC_API_KEY="your_anthropic_key"
GOOGLE_GENERATIVE_AI_API_KEY="your_google_key"
DEEPSEEK_API_KEY="your_deepseek_key"
```

### Database Setup

```bash
npx prisma generate
npx prisma db push
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Screenshots

<table>
  <tr>
    <td width="50%">
      <img src="https://jguybrl8o3m3wfj4.public.blob.vercel-storage.com/user_2wWdrhLm5ipSUk7ZfAXyLnEAFBe/1750355809271-image.png" alt="Screenshot 1" width="100%">
    </td>
    <td width="50%">
      <img src="https://jguybrl8o3m3wfj4.public.blob.vercel-storage.com/user_2wWdrhLm5ipSUk7ZfAXyLnEAFBe/1750356044670-image.png" alt="Screenshot 2" width="100%">
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="https://jguybrl8o3m3wfj4.public.blob.vercel-storage.com/user_2wWdrhLm5ipSUk7ZfAXyLnEAFBe/1750356076162-image.png" alt="Screenshot 3" width="100%">
    </td>
    <td width="50%">
      <img src="https://jguybrl8o3m3wfj4.public.blob.vercel-storage.com/user_2wWdrhLm5ipSUk7ZfAXyLnEAFBe/1750356119410-image.png" alt="Screenshot 4 (Light Mode)" width="100%">
    </td>
  </tr>
</table>
