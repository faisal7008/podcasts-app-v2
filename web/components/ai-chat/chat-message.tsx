"use client";

import { cn } from "@/lib/utils";
import { SourceCard } from "./source-card";
import type { ChatMessageItem } from "./chat-provider";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  message: ChatMessageItem;
}

/**
 * Single chat message bubble — user messages on the right, AI on the left.
 * AI messages show typing indicator while streaming and source citations after.
 */
export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold",
          isUser
            ? "bg-surface-dark text-white dark:bg-white dark:text-surface-dark"
            : "bg-gradient-to-br from-violet-500 to-indigo-600 text-white"
        )}
      >
        {isUser ? "U" : "AI"}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[85%] flex flex-col gap-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed",
            isUser
              ? "bg-surface-dark text-white dark:bg-white dark:text-surface-dark rounded-br-sm"
              : "bg-surface-dark/5 dark:bg-white/5 text-text-primary rounded-bl-sm"
          )}
        >
          {message.isStreaming && !message.content ? (
            <TypingIndicator />
          ) : (
            <div className="w-full break-words">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:underline">
                      {children}
                    </a>
                  ),
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold mb-2 mt-3 first:mt-0">{children}</h3>,
                  code: ({ inline, className, children, ...props }: any) => {
                    return !inline ? (
                      <pre className="bg-black/10 dark:bg-white/10 p-2 rounded-md overflow-x-auto mb-2 text-[11px] font-mono">
                        <code {...props} className={className}>
                          {children}
                        </code>
                      </pre>
                    ) : (
                      <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-[12px] font-mono" {...props}>
                        {children}
                      </code>
                    );
                  },
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-violet-500 pl-3 italic text-inherit opacity-80 mb-2">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {message.isStreaming && message.content && (
            <span className="inline-block w-1.5 h-4 bg-violet-500 animate-pulse ml-0.5 rounded-sm" />
          )}
        </div>

        {/* Source citations */}
        {message.sources && message.sources.length > 0 && (
          <div className="w-full flex flex-col gap-1.5 mt-1">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Sources
            </span>
            {message.sources.slice(0, 3).map((source, i) => (
              <SourceCard key={source.id} source={source} index={i} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-text-muted">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1 px-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}
