"use client";

import Link from "next/link";
import { Plus, Clock, CheckCircle2, Loader2, AlertCircle, FileAudio, Mic, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProtectedRoute } from "@/components/protected-route";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import { formatDuration } from "@/lib/utils";
import { useParams } from "next/navigation";
import { use } from "react";

interface StudioEpisode {
  id: string;
  title: string;
  description: string | null;
  audioUrl: string;
  duration: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface StudioPodcast {
  id: string;
  title: string;
  author: string;
  description: string | null;
  artwork: string | null;
  category: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: "Draft", color: "text-gray-500 bg-gray-100 dark:bg-gray-800", icon: FileAudio },
  uploading: { label: "Uploading", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30", icon: Loader2 },
  uploaded: { label: "Uploaded", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30", icon: Clock },
  processing: { label: "Processing", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/30", icon: Loader2 },
  ready: { label: "Ready", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30", icon: CheckCircle2 },
  published: { label: "Published", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30", icon: CheckCircle2 },
  failed: { label: "Failed", color: "text-red-600 bg-red-50 dark:bg-red-900/30", icon: AlertCircle },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;
  const isAnimated = status === "uploading" || status === "processing";

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
      "text-[11px] font-bold uppercase tracking-wider",
      config.color
    )}>
      <Icon size={12} className={isAnimated ? "animate-spin" : ""} />
      {config.label}
    </span>
  );
}

import { Play, MoreVertical, Pencil, Trash, X, Save } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { usePlayer } from "@/components/player/player-provider";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

function StudioEpisodeCard({ ep, podcast }: { ep: StudioEpisode, podcast: StudioPodcast }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(ep.title);
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const player = usePlayer();
  const queryClient = useQueryClient();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePlay = () => {
    if (!ep.audioUrl) {
      toast.error("No audio file available for this episode yet.");
      return;
    }
    player.play({
      id: ep.id,
      number: 0,
      title: ep.title,
      description: ep.description || "",
      date: ep.createdAt,
      duration: ep.duration || 0,
      podcastId: podcast.id,
      podcastTitle: podcast.title,
      artwork: podcast.artwork || "",
      audioSrc: ep.audioUrl,
    });
    player.openPlayer();
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/studio/podcasts/${podcast.id}/episodes/${ep.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Episode updated");
      queryClient.invalidateQueries({ queryKey: ["studio-podcast-episodes", podcast.id] });
      setIsEditing(false);
    } catch (err) {
      toast.error("Failed to update episode");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this episode? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/studio/podcasts/${podcast.id}/episodes/${ep.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Episode deleted");
      queryClient.invalidateQueries({ queryKey: ["studio-podcast-episodes", podcast.id] });
    } catch (err) {
      toast.error("Failed to delete episode");
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4",
        "rounded-[var(--radius-md)] border border-divider",
        "transition-colors hover:bg-gray-50 dark:hover:bg-surface-dark group"
      )}
    >
      {/* Play Button or Icon */}
      {ep.audioUrl && (ep.status === "ready" || ep.status === "published" || ep.status === "uploaded") ? (
        <button
          onClick={handlePlay}
          className={cn(
            "flex items-center justify-center w-12 h-12 shrink-0 rounded-full",
            "bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors cursor-pointer"
          )}
        >
          <Play size={20} className="ml-1" />
        </button>
      ) : (
        <div className={cn(
          "flex items-center justify-center w-12 h-12 shrink-0 rounded-full",
          "bg-gray-100 dark:bg-surface-dark"
        )}>
          <FileAudio size={20} className="text-text-muted" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="flex-1 bg-white dark:bg-surface-dark border border-divider rounded-[var(--radius-sm)] px-3 py-1.5 text-[14px] text-text-dark font-bold focus:outline-none focus:border-accent"
              autoFocus
              disabled={isSaving}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") setIsEditing(false);
              }}
            />
            <button
              onClick={handleSave}
              disabled={isSaving || !editTitle.trim()}
              className="p-1.5 text-accent hover:bg-accent/10 rounded-full transition-colors"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="p-1.5 text-text-muted hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <p className="text-body font-bold text-text-dark truncate">
            {ep.title}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[12px] text-text-muted">
            {new Date(ep.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          {ep.duration > 0 && (
            <span className="text-[12px] text-text-muted">
              {formatDuration(ep.duration)}
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      <StatusBadge status={ep.status} />

      {/* Actions */}
      <div className="relative ml-2" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-text-muted hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreVertical size={18} />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-10 w-36 bg-white dark:bg-surface-dark border border-divider rounded-[var(--radius-sm)] shadow-lg z-10 py-1">
            <button
              onClick={() => { setIsEditing(true); setShowMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-text-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Pencil size={14} />
              Edit Title
            </button>
            <button
              onClick={() => { handleDelete(); setShowMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash size={14} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PodcastDashboardContent() {
  const params = useParams();
  const podcastId = params.id as string;

  const { data, isLoading } = useQuery<{ podcast: StudioPodcast, episodes: StudioEpisode[] }>({
    queryKey: ["studio-podcast-episodes", podcastId],
    queryFn: () => fetcher(`/api/studio/podcasts/${podcastId}/episodes`),
  });

  const podcast = data?.podcast;
  const episodes = data?.episodes || [];

  return (
    <>
      <Header
        variant="interior"
        backTitle="Podcasts"
        backHref="/studio"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Studio", href: "/studio" },
          { label: podcast?.title || "Podcast", href: `/studio/podcasts/${podcastId}` },
        ]}
      />

      <main className="flex-1 w-full">
        <div className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] py-8">
          
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 text-[13px] font-bold text-text-muted hover:text-text-dark transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Back to Podcasts
          </Link>

          {isLoading ? (
            <div className="flex flex-col gap-6">
              <div className="h-32 rounded-[var(--radius-lg)] bg-divider animate-pulse" />
              <div className="h-20 rounded-[var(--radius-md)] bg-divider animate-pulse" />
              <div className="h-20 rounded-[var(--radius-md)] bg-divider animate-pulse" />
            </div>
          ) : !podcast ? (
            <div className="py-20 text-center">
              <h2 className="text-title text-text-dark">Podcast not found</h2>
            </div>
          ) : (
            <>
              {/* Podcast Header Info */}
              <div className={cn(
                "flex flex-col md:flex-row items-start md:items-center gap-6 p-6 mb-8",
                "rounded-[var(--radius-lg)] border border-divider bg-gray-50 dark:bg-surface-dark"
              )}>
                {podcast.artwork ? (
                  <img
                    src={podcast.artwork}
                    alt={podcast.title}
                    className="w-24 h-24 rounded-[var(--radius-md)] object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex items-center justify-center w-24 h-24 rounded-[var(--radius-md)] bg-gray-200 dark:bg-gray-800 shrink-0">
                    <Mic size={32} className="text-text-muted" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="text-title text-text-dark truncate">{podcast.title}</h1>
                  <p className="text-body text-text-muted mt-1 truncate">By {podcast.author}</p>
                  {podcast.description && (
                    <p className="text-[13px] text-text-muted mt-2 line-clamp-2 max-w-3xl">
                      {podcast.description}
                    </p>
                  )}
                </div>
                <Link
                  href={`/studio/podcasts/${podcast.id}/episodes/new`}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 shrink-0",
                    "rounded-[var(--radius-sm)] font-bold text-[14px]",
                    "bg-surface-dark text-white dark:bg-white dark:text-surface-dark",
                    "transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
                  )}
                >
                  <Plus size={18} />
                  New Episode
                </Link>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h2 className="text-subtitle-bold text-text-dark">Episodes</h2>
                <span className="text-[13px] font-bold text-text-muted bg-gray-100 dark:bg-surface-dark px-2.5 py-0.5 rounded-full">
                  {episodes.length} Total
                </span>
              </div>

              {episodes.length === 0 ? (
                /* Empty state */
                <div className={cn(
                  "flex flex-col items-center justify-center py-20",
                  "rounded-[var(--radius-lg)] border-2 border-dashed border-divider"
                )}>
                  <div className={cn(
                    "flex items-center justify-center w-16 h-16 rounded-full mb-4",
                    "bg-gray-100 dark:bg-surface-dark"
                  )}>
                    <FileAudio size={28} className="text-text-muted" />
                  </div>
                  <h3 className="text-subtitle-bold text-text-dark mb-1">
                    No episodes yet
                  </h3>
                  <p className="text-body text-text-muted mb-6">
                    Record or upload your first episode for this podcast
                  </p>
                  <Link
                    href={`/studio/podcasts/${podcast.id}/episodes/new`}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3",
                      "rounded-[var(--radius-full)] font-bold text-[14px]",
                      "bg-surface-dark text-white dark:bg-white dark:text-surface-dark",
                      "transition-all duration-200 hover:opacity-90"
                    )}
                  >
                    <Plus size={18} />
                    Create Episode
                  </Link>
                </div>
              ) : (
                /* Episode cards */
                <div className="flex flex-col gap-3">
                  {episodes.map((ep) => (
                    <StudioEpisodeCard key={ep.id} ep={ep} podcast={podcast} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default function PodcastDashboardPage() {
  return (
    <ProtectedRoute>
      <PodcastDashboardContent />
    </ProtectedRoute>
  );
}
