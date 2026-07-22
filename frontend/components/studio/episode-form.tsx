"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAudioUpload } from "@/hooks/use-audio-upload";

interface EpisodeFormProps {
  /** The audio blob or file ready for upload */
  audioFile: Blob | File;
  /** The podcast ID this episode belongs to */
  podcastId: string;
  /** Duration in seconds (from recorder or file metadata) */
  durationSeconds?: number;
  /** File name for display and upload */
  fileName?: string;
  /** Go back to the recording/upload step */
  onBack: () => void;
}

/**
 * Episode metadata form — shown after audio is ready.
 * Handles upload to Azure + episode creation in one submit flow.
 */
export function EpisodeForm({
  audioFile,
  podcastId,
  durationSeconds = 0,
  fileName,
  onBack,
}: EpisodeFormProps) {
  const router = useRouter();
  const { isUploading, progress, error: uploadError, uploadAudio } = useAudioUpload();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isSubmitting = isUploading || isCreating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("Title is required");
      return;
    }

    try {
      // Step 1: Upload audio to Azure Blob Storage
      const displayName = fileName || (audioFile instanceof File ? audioFile.name : `recording-${Date.now()}.webm`);
      const publicUrl = await uploadAudio(audioFile, displayName);

      if (!publicUrl) {
        setFormError("Upload failed. Please try again.");
        return;
      }

      // Step 2: Create episode in database
      setIsCreating(true);

      const response = await fetch("/api/episodes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          podcastId,
          title: title.trim(),
          description: description.trim() || undefined,
          audioUrl: publicUrl,
          duration: durationSeconds,
          fileSizeBytes: audioFile.size,
          mimeType: audioFile.type || "audio/webm",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create episode");
      }

      toast.success("Episode created successfully!");
      router.push(`/studio/podcasts/${podcastId}`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setFormError(message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Error messages */}
      {(formError || uploadError) && (
        <div className="rounded-[var(--radius-sm)] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-[13px] text-red-700 dark:text-red-300">
          {formError || uploadError}
        </div>
      )}

      {/* Audio preview */}
      <div className={cn(
        "flex items-center gap-3 p-4",
        "rounded-[var(--radius-md)] border border-divider",
        "bg-gray-50 dark:bg-surface-dark"
      )}>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-text-muted uppercase font-bold tracking-wider mb-1">
            Audio ready
          </p>
          <p className="text-body text-text-dark truncate">
            {fileName || (audioFile instanceof File ? audioFile.name : "Recording")}
          </p>
          <p className="text-[12px] text-text-muted">
            {formatFileSize(audioFile.size)}
            {durationSeconds > 0 && ` • ${formatDurationMinSec(durationSeconds)}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="text-[13px] text-text-muted hover:text-text-dark transition-colors disabled:opacity-50"
        >
          Change
        </button>
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="episode-title" className="text-label text-text-muted">
          Title *
        </label>
        <input
          id="episode-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Episode title"
          maxLength={200}
          disabled={isSubmitting}
          className={cn(
            "w-full px-4 py-3 rounded-[var(--radius-sm)]",
            "bg-bg border border-divider text-text-dark text-body",
            "placeholder:text-text-muted",
            "transition-colors focus:outline-none focus:border-text-muted",
            "disabled:opacity-50"
          )}
          autoFocus
        />
        <p className="text-[11px] text-text-muted text-right">
          {title.length}/200
        </p>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="episode-description" className="text-label text-text-muted">
          Description
        </label>
        <textarea
          id="episode-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this episode about? (optional)"
          maxLength={5000}
          rows={4}
          disabled={isSubmitting}
          className={cn(
            "w-full px-4 py-3 rounded-[var(--radius-sm)] resize-y",
            "bg-bg border border-divider text-text-dark text-body",
            "placeholder:text-text-muted",
            "transition-colors focus:outline-none focus:border-text-muted",
            "disabled:opacity-50"
          )}
        />
        <p className="text-[11px] text-text-muted text-right">
          {description.length}/5000
        </p>
      </div>

      {/* Upload progress */}
      {isUploading && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-text-muted">Uploading audio...</span>
            <span className="text-text-dark font-bold">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-divider rounded-full overflow-hidden">
            <div
              className="h-full bg-surface-dark dark:bg-white rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className={cn(
            "flex-1 px-5 py-3 rounded-[var(--radius-sm)]",
            "border border-divider text-body font-bold text-text-dark",
            "transition-all duration-200 hover:bg-gray-100 dark:hover:bg-surface-dark",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-5 py-3",
            "rounded-[var(--radius-sm)] font-bold text-body",
            "bg-surface-dark text-white dark:bg-white dark:text-surface-dark",
            "transition-all duration-200 hover:opacity-90",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {isUploading ? "Uploading..." : "Creating..."}
            </>
          ) : (
            "Create Episode"
          )}
        </button>
      </div>
    </form>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDurationMinSec(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
