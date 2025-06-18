import React, { useMemo, ReactNode, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CopyIcon } from "@/components/icons/CopyIcon";
import { Button } from "@/components/ui/button";
import { LucideCircleDollarSign } from "lucide-react";

import showToast from "@/lib/toast";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";

// Helper function to get plain text from React children
const getTextContent = (node: ReactNode): string => {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (node === null || node === undefined) return "";

  if (Array.isArray(node)) {
    return node.map(getTextContent).join("");
  }

  if (typeof node === "object") {
    const props = (node as any).props;
    if (props?.children) {
      return getTextContent(props.children);
    }
  }

  return "";
};

const copyToClipboard = (text: string, language: string) => {
  navigator.clipboard.writeText(text.replace(/\n$/, ""));
  showToast.custom(`${language || "Code"} copied to clipboard`, "📋");
};

const copyMessageToClipboard = (content: string) => {
  navigator.clipboard.writeText(content);
  showToast.success("Message copied to clipboard");
};

const markdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "";

    return !inline && match ? (
      <div className="mt-1 md:mt-2 mb-1 md:mb-2 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-2 md:px-4 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-[0.65rem] md:text-xs border-b border-neutral-200 dark:border-neutral-700">
          <span>{language}</span>
          <button
            onClick={() => copyToClipboard(getTextContent(children), language)}
            className="hover:text-neutral-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
            title="Copy code"
          >
            <CopyIcon className="h-3 w-3 md:h-4 md:w-4" />
          </button>
        </div>
        <pre className="overflow-x-auto p-2 md:p-4 bg-gray-800 dark:bg-neutral-900 text-[0.7rem] md:text-xs">
          <code className={`${className} language-${language}`} {...props}>
            {children}
          </code>
        </pre>
      </div>
    ) : (
      <code
        className={`${className} bg-neutral-400 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 px-1 py-0.5 rounded text-[0.7rem] md:text-xs break-all`}
        {...props}
      >
        {children}
      </code>
    );
  },
  table({ children }: any) {
    return (
      <div className="overflow-x-auto">
        <table className="border-collapse border border-neutral-700 my-2 md:my-4 w-full text-[0.7rem] md:text-xs">
          {children}
        </table>
      </div>
    );
  },
  th({ children }: any) {
    return (
      <th className="border border-neutral-700 px-2 md:px-3 py-1 md:py-2 bg-neutral-800">
        {children}
      </th>
    );
  },
  td({ children }: any) {
    return (
      <td className="border border-neutral-700 px-2 md:px-3 py-1 md:py-2">
        {children}
      </td>
    );
  },
  p({ children }: any) {
    return <p className="my-1 md:my-2">{children}</p>;
  },
  a({ children, href }: any) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:underline"
      >
        {children}
      </a>
    );
  },
  ul({ children }: any) {
    return <ul className="list-disc pl-4 md:pl-5 my-1 md:my-2">{children}</ul>;
  },
  ol({ children }: any) {
    return (
      <ol className="list-decimal pl-4 md:pl-5 my-1 md:my-2">{children}</ol>
    );
  },
  blockquote({ children }: any) {
    return (
      <blockquote className="border-l-4 border-neutral-500 pl-3 md:pl-4 py-1 my-1 md:my-2 italic">
        {children}
      </blockquote>
    );
  },
  h1({ children }: any) {
    return (
      <h1 className="text-base md:text-lg font-bold my-2 md:my-3">
        {children}
      </h1>
    );
  },
  h2({ children }: any) {
    return (
      <h2 className="text-sm md:text-base font-bold my-2 md:my-3">
        {children}
      </h2>
    );
  },
  h3({ children }: any) {
    return (
      <h3 className="text-xs md:text-sm font-bold my-1 md:my-2">{children}</h3>
    );
  },
};

interface MessageProps {
  readonly content: string;
  readonly isUser: boolean;
  readonly promptTokens?: number;
  readonly completionTokens?: number;
  readonly attachments?: Array<{ type: string; url: string; filename?: string }>;
}

export const Message = React.memo(function Message({
  content,
  isUser,
  promptTokens,
  completionTokens,
  attachments,
}: MessageProps) {
  const [isHovered, setIsHovered] = useState(false);
  // Ensure content is always a string
  const safeContent =
    typeof content === "string"
      ? content
      : content
        ? JSON.stringify(content)
        : "";

  const markdownContent = useMemo(() => {
    if (isUser) return null;

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
        components={markdownComponents}
      >
        {safeContent}
      </ReactMarkdown>
    );
  }, [safeContent, isUser]);

  // Filter image attachments
  const imageAttachments = attachments?.filter(att => att.type === "image") || [];
  console.log('Rendering Message, attachments:', attachments, 'imageAttachments:', imageAttachments);

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2 md:mb-4`}
    >
      <div
        className={`flex ${isUser ? "flex-row-reverse" : "flex-row"} ${isUser ? "max-w-[85%]" : "max-w-[98%]"} gap-1 md:gap-2`}
      >
        <div
          className="flex flex-col items-start w-full group"
          onMouseEnter={() => !isUser && setIsHovered(true)}
          onMouseLeave={() => !isUser && setIsHovered(false)}
        >
          <div
            className={`py-2 md:py-3 px-3 md:px-4 rounded-2xl ${isUser
                ? "bg-slate-800 text-white rounded-tr-none dark:bg-gray-100 dark:text-black"
                : "bg-background rounded-tl-none"
              }`}
          >
            {/* Always render for debug */}
            <div className="mb-2 space-y-2">
              {imageAttachments.map((attachment, index) => (
                <div key={index} className="relative">
                  <img
                    src={attachment.url}
                    alt={attachment.filename || `Image ${index + 1}`}
                    className="max-w-full max-h-64 rounded-lg border border-gray-200 dark:border-gray-700"
                    loading="lazy"
                  />
                  {attachment.filename && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {attachment.filename}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {isUser ? (
              <pre className="text-xs md:text-sm whitespace-pre-wrap break-words font-sans">
                {safeContent}
              </pre>
            ) : (
              <div className="markdown-content text-xs md:text-sm whitespace-normal break-words">
                {markdownContent}
              </div>
            )}
          </div>
          {!isUser && (
            <div className="flex w-full">
              <div
                className={`flex items-center gap-2 mt-1 ml-1 transition-all duration-200
                ${isHovered ? "opacity-80 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none"}`}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0"
                  onClick={() => copyMessageToClipboard(safeContent)}
                  title="Copy message"
                >
                  <CopyIcon className="h-4 w-4" />
                </Button>
                {(typeof promptTokens === "number" ||
                  typeof completionTokens === "number") && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <LucideCircleDollarSign className="h-4 w-4" />
                      <span>
                        {(promptTokens || 0) + (completionTokens || 0)} Tokens
                      </span>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
