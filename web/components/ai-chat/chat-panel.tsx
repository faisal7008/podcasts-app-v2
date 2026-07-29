"use client";

import { useRef, useEffect } from "react";
import { X, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "./chat-provider";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";

/**
 * Slide-in AI Chat Panel — the main conversational UI for RAG Q&A.
 *
 * Slides in from the right side. Features:
 * - Glassmorphism header with gradient accent
 * - Auto-scrolling message list
 * - Streaming AI responses with typing indicators
 * - Source citation cards with timestamp linking
 * - Suggested prompts for first-time users
 */
export function ChatPanel() {
  const {
    messages,
    isLoading,
    isOpen,
    episodeId,
    sendMessage,
    closeChat,
    clearMessages,
  } = useChat();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) closeChat();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeChat]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 animate-fade-in"
        onClick={closeChat}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 z-50",
          "w-full sm:w-[420px] md:w-[460px]",
          "flex flex-col",
          "bg-bg/95 dark:bg-bg/95 backdrop-blur-xl",
          "border-l border-divider/40",
          "shadow-[-8px_0_30px_rgba(0,0,0,0.1)]",
          "animate-slide-in-right"
        )}
        role="complementary"
        aria-label="AI Chat"
      >
        {/* Header */}
        <header
          className={cn(
            "flex items-center justify-between",
            "px-5 py-4",
            "border-b border-divider/40",
            "bg-gradient-to-r from-violet-500/5 to-indigo-500/5",
          )}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600">
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-text-dark">
                Ask AI
              </h2>
              <p className="text-[11px] text-text-muted">
                {episodeId
                  ? "Ask about this episode"
                  : "Ask about your podcasts"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className={cn(
                  "p-2 rounded-full",
                  "text-text-muted hover:text-text-dark",
                  "hover:bg-surface-dark/5 dark:hover:bg-white/5",
                  "transition-colors"
                )}
                aria-label="Clear conversation"
                title="Clear conversation"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={closeChat}
              className={cn(
                "p-2 rounded-full",
                "text-text-muted hover:text-text-dark",
                "hover:bg-surface-dark/5 dark:hover:bg-white/5",
                "transition-colors"
              )}
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-5 scrollbar-hide"
        >
          {messages.length === 0 ? (
            <EmptyState episodeId={episodeId} />
          ) : (
            messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-divider/40">
          <ChatInput
            onSend={sendMessage}
            isLoading={isLoading}
            episodeId={episodeId}
          />
        </div>
      </div>
    </>
  );
}

function EmptyState({ episodeId }: { episodeId: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-violet-500/10 to-indigo-600/10 mb-4">
        <Sparkles size={24} className="text-violet-500" />
      </div>
      <h3 className="text-[16px] font-bold text-text-dark mb-1">
        {episodeId ? "Ask About This Episode" : "AI Podcast Assistant"}
      </h3>
      <p className="text-[13px] text-text-muted max-w-[280px] leading-relaxed">
        {episodeId
          ? "Ask questions about the transcript, get summaries, or explore specific topics discussed in this episode."
          : "Ask questions across all your podcast episodes. I'll find relevant content and give you grounded answers."}
      </p>
    </div>
  );
}
