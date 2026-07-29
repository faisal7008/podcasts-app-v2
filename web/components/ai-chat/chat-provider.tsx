"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SourceMeta {
  id: string;
  episodeId: string;
  episodeTitle: string;
  podcastTitle: string;
  artwork: string;
  score: number;
  timestamp: string | null;
  preview: string;
}

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceMeta[];
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatState {
  messages: ChatMessageItem[];
  isLoading: boolean;
  isOpen: boolean;
  episodeId: string | null;
  conversationId: string;
}

interface ChatContextValue extends ChatState {
  sendMessage: (query: string) => Promise<void>;
  openChat: (episodeId?: string) => void;
  closeChat: () => void;
  toggleChat: () => void;
  clearMessages: () => void;
  setEpisodeScope: (episodeId: string | null) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    isOpen: false,
    episodeId: null,
    conversationId: generateId(),
  });

  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (query: string) => {
      if (!query.trim() || state.isLoading) return;

      // Add user message
      const userMsg: ChatMessageItem = {
        id: generateId(),
        role: "user",
        content: query.trim(),
        timestamp: new Date(),
      };

      // Add placeholder for assistant response
      const assistantMsg: ChatMessageItem = {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMsg, assistantMsg],
        isLoading: true,
      }));

      // Abort any previous request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/rag/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: query.trim(),
            episodeId: state.episodeId,
            conversationId: state.conversationId,
            history: state.messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || `Request failed: ${response.status}`);
        }

        // Stream the response
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          fullContent += decoder.decode(value, { stream: true });

          // Update the assistant message content in real-time
          // Strip the [SOURCES] block from the displayed content
          const displayContent = fullContent.split("\n\n[SOURCES]")[0];

          setState((prev) => ({
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: displayContent }
                : m
            ),
          }));
        }

        // Parse sources from the final content
        let sources: SourceMeta[] = [];
        const sourcesMatch = fullContent.match(/\n\n\[SOURCES\](.*)/s);
        if (sourcesMatch) {
          try {
            sources = JSON.parse(sourcesMatch[1]);
          } catch {
            // Source parsing is non-critical
          }
        }

        const finalContent = fullContent.split("\n\n[SOURCES]")[0];

        // Finalize the assistant message
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: finalContent, sources, isStreaming: false }
              : m
          ),
          isLoading: false,
        }));
      } catch (error: any) {
        if (error.name === "AbortError") return;

        // Update assistant message with error
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === assistantMsg.id
              ? {
                  ...m,
                  content:
                    error.message ||
                    "Sorry, I couldn't process your request. Please try again.",
                  isStreaming: false,
                }
              : m
          ),
          isLoading: false,
        }));
      }
    },
    [state.isLoading, state.episodeId, state.conversationId, state.messages]
  );

  const openChat = useCallback((episodeId?: string) => {
    setState((prev) => ({
      ...prev,
      isOpen: true,
      ...(episodeId && episodeId !== prev.episodeId
        ? {
            episodeId,
            messages: [],
            conversationId: generateId(),
          }
        : {}),
    }));
  }, []);

  const closeChat = useCallback(() => {
    abortRef.current?.abort();
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const toggleChat = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const clearMessages = useCallback(() => {
    abortRef.current?.abort();
    setState((prev) => ({
      ...prev,
      messages: [],
      conversationId: generateId(),
      isLoading: false,
    }));
  }, []);

  const setEpisodeScope = useCallback((episodeId: string | null) => {
    setState((prev) => ({
      ...prev,
      episodeId,
      messages: [],
      conversationId: generateId(),
    }));
  }, []);

  return (
    <ChatContext.Provider
      value={{
        ...state,
        sendMessage,
        openChat,
        closeChat,
        toggleChat,
        clearMessages,
        setEpisodeScope,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
