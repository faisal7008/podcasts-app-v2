"use client";

import { useState } from "react";
import { Mic, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProtectedRoute } from "@/components/protected-route";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AudioRecorder } from "@/components/studio/audio-recorder";
import { AudioUploader } from "@/components/studio/audio-uploader";
import { EpisodeForm } from "@/components/studio/episode-form";
import { useParams } from "next/navigation";

type Mode = "record" | "upload";
type Step = "capture" | "details";

function NewEpisodeContent() {
  const params = useParams();
  const podcastId = params.id as string;

  const [mode, setMode] = useState<Mode>("record");
  const [step, setStep] = useState<Step>("capture");
  const [audioFile, setAudioFile] = useState<Blob | File | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioFileName, setAudioFileName] = useState<string | undefined>();

  // Called when recording is complete
  const handleRecordingComplete = (blob: Blob, duration: number) => {
    setAudioFile(blob);
    setAudioDuration(duration);
    setAudioFileName(`recording-${Date.now()}.webm`);
    setStep("details");
  };

  // Called when a file is selected via upload
  const handleFileSelected = (file: File) => {
    setAudioFile(file);
    setAudioFileName(file.name);
    // Try to get duration from audio element
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.addEventListener("loadedmetadata", () => {
      setAudioDuration(Math.floor(audio.duration));
      URL.revokeObjectURL(audio.src);
    });
    audio.addEventListener("error", () => {
      URL.revokeObjectURL(audio.src);
    });
    setStep("details");
  };

  // Go back to capture step
  const handleBack = () => {
    setStep("capture");
    setAudioFile(null);
    setAudioDuration(0);
    setAudioFileName(undefined);
  };

  return (
    <>
      <Header
        variant="interior"
        backTitle="New Episode"
        backHref="/studio"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Studio", href: "/studio" },
          { label: "New Episode", href: "/studio/new" },
        ]}
      />

      <main className="flex-1 w-full">
        <div className="mx-auto max-w-[640px] px-4 py-8">
          {/* Page title */}
          <div className="mb-8">
            <h1 className="text-title text-text-dark">New Episode</h1>
            <p className="text-body text-text-muted mt-1">
              {step === "capture"
                ? "Record a new podcast or upload an existing audio file"
                : "Add details about your episode"
              }
            </p>
          </div>

          {step === "capture" ? (
            <>
              {/* Mode toggle */}
              <div className={cn(
                "flex rounded-[var(--radius-sm)] p-1 mb-8",
                "bg-gray-100 dark:bg-surface-dark"
              )}>
                <button
                  onClick={() => setMode("record")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5",
                    "rounded-[6px] text-body font-bold",
                    "transition-all duration-200",
                    mode === "record"
                      ? "bg-bg text-text-dark shadow-sm"
                      : "text-text-muted hover:text-text-dark"
                  )}
                >
                  <Mic size={16} />
                  Record
                </button>
                <button
                  onClick={() => setMode("upload")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5",
                    "rounded-[6px] text-body font-bold",
                    "transition-all duration-200",
                    mode === "upload"
                      ? "bg-bg text-text-dark shadow-sm"
                      : "text-text-muted hover:text-text-dark"
                  )}
                >
                  <Upload size={16} />
                  Upload
                </button>
              </div>

              {/* Content based on mode */}
              <div className="animate-fade-in">
                {mode === "record" ? (
                  <AudioRecorder onRecordingComplete={handleRecordingComplete} />
                ) : (
                  <AudioUploader onFileSelected={handleFileSelected} />
                )}
              </div>
            </>
          ) : (
            /* Episode details form */
            <div className="animate-fade-in">
              {audioFile && (
                <EpisodeForm
                  audioFile={audioFile}
                  podcastId={podcastId}
                  durationSeconds={audioDuration}
                  fileName={audioFileName}
                  onBack={handleBack}
                />
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default function NewEpisodePage() {
  return (
    <ProtectedRoute>
      <NewEpisodeContent />
    </ProtectedRoute>
  );
}
