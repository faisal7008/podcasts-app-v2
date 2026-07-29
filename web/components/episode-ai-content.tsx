"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Episode } from "@/types/podcast";
import { sanitizeHtml } from "@/lib/sanitize";
import { Divider } from "@/components/divider";

interface EpisodeAIContentProps {
  episode: Episode;
  onOpenChat?: () => void;
}

type Tab = "summary" | "notes" | "transcript" | "chapters";

export function EpisodeAIContent({ episode, onOpenChat }: EpisodeAIContentProps) {
  const tabs: { id: Tab; label: string; content: any }[] = [];

  if (episode.aiSummary) tabs.push({ id: "summary", label: "AI Summary", content: episode.aiSummary });
  if (episode.showNotes) tabs.push({ id: "notes", label: "Show Notes", content: episode.showNotes });
  if (episode.chapters && Array.isArray(episode.chapters) && episode.chapters.length > 0) {
    tabs.push({ id: "chapters", label: "Chapters", content: episode.chapters });
  }
  if (episode.transcript) tabs.push({ id: "transcript", label: "Transcript", content: episode.transcript });

  const [activeTab, setActiveTab] = useState<Tab>(tabs[0]?.id || "summary");

  if (tabs.length === 0) return null;

  return (
    <div className="">
      {/* Tabs Header */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-full transition-colors",
              activeTab === tab.id
                ? "bg-surface-dark text-white"
                : "bg-surface-dark/5 text-text-primary hover:bg-surface-dark/10"
            )}
          >
            {tab.label}
          </button>
        ))}

        {/* Ask AI button */}
        {onOpenChat && (
          <button
            onClick={onOpenChat}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full",
              "bg-gradient-to-r from-violet-600 to-indigo-600",
              "text-white shadow-sm",
              "hover:shadow-md hover:scale-[1.02]",
              "active:scale-[0.98]",
              "transition-all duration-150"
            )}
          >
            <Sparkles size={14} />
            Ask AI
          </button>
        )}
      </div>
      {/* Divider */}
      <Divider className="mt-2" />
      {/* Tabs Content */}
      <div className="pt-4">
        {activeTab === "summary" && episode.aiSummary && (
          <div className="prose prose-sm md:prose-base max-w-none text-text-primary">
            <p>{episode.aiSummary}</p>
          </div>
        )}

        {activeTab === "notes" && episode.showNotes && (
          <div
            className="prose prose-sm md:prose-base max-w-none text-text-primary prose-a:text-primary whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ 
              __html: sanitizeHtml(
                episode.showNotes
                  .replace(/•/g, '\n• ')       // Ensure bullets have a newline before them
                  .replace(/\n\s*\n/g, '\n\n') // Normalize multiple newlines
                  .trim()
              ) 
            }}
          />
        )}

        {activeTab === "transcript" && episode.transcript && (
          <div className="prose prose-sm md:prose-base max-w-none text-text-primary h-96 overflow-y-auto whitespace-pre-wrap">
            {episode.transcript.replace(/^\[\d{2}:\d{2}(:\d{2})?\]\s*/gm, "")}
          </div>
        )}

        {activeTab === "chapters" && episode.chapters && Array.isArray(episode.chapters) && (
          <div className="space-y-4">
            {episode.chapters.map((chapter: any, i: number) => (
              <div key={i} className="flex gap-4 items-start p-4 rounded-[var(--radius-sm)] hover:bg-surface-dark/5 transition-colors">
                <span className="font-mono text-primary font-medium shrink-0 pt-0.5">
                  {formatTime(chapter.startTime || chapter.start || 0)}
                </span>
                <div>
                  <h4 className="font-semibold text-text-dark">{chapter.title}</h4>
                  {chapter.summary && <p className="text-sm text-text-primary mt-1">{chapter.summary}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

