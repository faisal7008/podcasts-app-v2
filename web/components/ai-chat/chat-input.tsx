"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  episodeId?: string | null;
  className?: string;
}

const SUGGESTED_PROMPTS = [
  "Summarize this episode",
  "What are the key takeaways?",
  "Who are the speakers?",
  "What topics were discussed?",
  "Any recommendations mentioned?",
];

const GLOBAL_PROMPTS = [
  "What episodes discuss AI?",
  "Summarize my recent episodes",
  "Find discussions about technology",
  "What topics come up most often?",
];

/**
 * Chat input with send button and suggested prompt chips.
 */
export function ChatInput({
  onSend,
  isLoading,
  episodeId,
  className,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prompts = episodeId ? SUGGESTED_PROMPTS : GLOBAL_PROMPTS;

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (prompt: string) => {
    if (isLoading) return;
    onSend(prompt);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Suggested prompts (show only when no messages) */}
      <div className="flex flex-wrap gap-1.5">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handlePromptClick(prompt)}
            disabled={isLoading}
            className={cn(
              "px-3 py-1.5 text-[11px] font-medium rounded-full",
              "border border-divider/60",
              "text-text-muted hover:text-text-dark",
              "hover:bg-surface-dark/5 dark:hover:bg-white/5",
              "transition-all duration-150",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div
        className={cn(
          "flex items-end gap-2 p-2 rounded-2xl",
          "bg-surface-dark/5 dark:bg-white/5",
          "border border-divider/40",
          "focus-within:border-violet-500/40",
          "transition-colors"
        )}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            episodeId
              ? "Ask about this episode..."
              : "Ask about your podcasts..."
          }
          rows={1}
          disabled={isLoading}
          className={cn(
            "flex-1 bg-transparent resize-none",
            "text-[13px] text-text-primary placeholder:text-text-muted/60",
            "outline-none border-none",
            "min-h-[36px] max-h-[120px] py-2 px-2",
            "disabled:opacity-50"
          )}
        />

        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className={cn(
            "flex items-center justify-center",
            "w-8 h-8 rounded-full shrink-0",
            "bg-gradient-to-r from-violet-600 to-indigo-600",
            "text-white shadow-sm",
            "transition-all duration-150",
            "hover:shadow-md hover:scale-105",
            "active:scale-95",
            "disabled:opacity-30 disabled:hover:scale-100 disabled:hover:shadow-sm"
          )}
          aria-label="Send message"
        >
          <Send size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
