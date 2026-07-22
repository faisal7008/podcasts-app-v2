"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProtectedRoute } from "@/components/protected-route";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

function NewPodcastContent() {
  const router = useRouter();
  
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [artworkUrl, setArtworkUrl] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || !author.trim() || !category.trim()) {
      setFormError("Title, author, and category are required.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/podcasts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim(),
          description: description.trim() || undefined,
          category: category.trim(),
          artwork: artworkUrl.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create podcast");
      }

      toast.success("Podcast created successfully!");
      router.push("/studio");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header
        variant="interior"
        backTitle="New Podcast"
        backHref="/studio"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Studio", href: "/studio" },
          { label: "New Podcast", href: "/studio/podcasts/new" },
        ]}
      />

      <main className="flex-1 w-full">
        <div className="mx-auto max-w-[640px] px-4 py-8">
          <div className="mb-8">
            <h1 className="text-title text-text-dark">Create Podcast</h1>
            <p className="text-body text-text-muted mt-1">
              Start a new show to publish your episodes under
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-fade-in">
            {formError && (
              <div className="rounded-[var(--radius-sm)] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-[13px] text-red-700 dark:text-red-300">
                {formError}
              </div>
            )}

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="podcast-title" className="text-label text-text-muted">
                Show Title *
              </label>
              <input
                id="podcast-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g. The Daily Tech Show"
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
            </div>

            {/* Author */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="podcast-author" className="text-label text-text-muted">
                Author / Host *
              </label>
              <input
                id="podcast-author"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="E.g. Jane Doe"
                maxLength={200}
                disabled={isSubmitting}
                className={cn(
                  "w-full px-4 py-3 rounded-[var(--radius-sm)]",
                  "bg-bg border border-divider text-text-dark text-body",
                  "placeholder:text-text-muted",
                  "transition-colors focus:outline-none focus:border-text-muted",
                  "disabled:opacity-50"
                )}
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="podcast-category" className="text-label text-text-muted">
                Category *
              </label>
              <input
                id="podcast-category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="E.g. Technology, Comedy, Education"
                maxLength={100}
                disabled={isSubmitting}
                className={cn(
                  "w-full px-4 py-3 rounded-[var(--radius-sm)]",
                  "bg-bg border border-divider text-text-dark text-body",
                  "placeholder:text-text-muted",
                  "transition-colors focus:outline-none focus:border-text-muted",
                  "disabled:opacity-50"
                )}
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="podcast-description" className="text-label text-text-muted">
                Description
              </label>
              <textarea
                id="podcast-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is your show about?"
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
            </div>

            {/* Artwork URL (Temporary simple input until we add image upload) */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="podcast-artwork" className="text-label text-text-muted">
                Artwork URL
              </label>
              <input
                id="podcast-artwork"
                type="url"
                value={artworkUrl}
                onChange={(e) => setArtworkUrl(e.target.value)}
                placeholder="https://example.com/cover.jpg"
                disabled={isSubmitting}
                className={cn(
                  "w-full px-4 py-3 rounded-[var(--radius-sm)]",
                  "bg-bg border border-divider text-text-dark text-body",
                  "placeholder:text-text-muted",
                  "transition-colors focus:outline-none focus:border-text-muted",
                  "disabled:opacity-50"
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push("/studio")}
                disabled={isSubmitting}
                className={cn(
                  "flex-1 px-5 py-3 rounded-[var(--radius-sm)]",
                  "border border-divider text-body font-bold text-text-dark",
                  "transition-all duration-200 hover:bg-gray-100 dark:hover:bg-surface-dark",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !author.trim() || !category.trim()}
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
                    Creating...
                  </>
                ) : (
                  "Create Podcast"
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default function NewPodcastPage() {
  return (
    <ProtectedRoute>
      <NewPodcastContent />
    </ProtectedRoute>
  );
}
