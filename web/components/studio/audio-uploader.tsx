"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileAudio, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Max file size: 500MB */
const MAX_FILE_SIZE = 500 * 1024 * 1024;

const ACCEPTED_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",
  "audio/ogg",
  "audio/flac",
  "audio/webm",
  "audio/aac",
];

interface AudioUploaderProps {
  /** Called when a valid file is selected */
  onFileSelected: (file: File) => void;
}

/**
 * Drag-and-drop audio file uploader with validation.
 * Validates file type and size before passing to parent.
 */
export function AudioUploader({ onFileSelected }: AudioUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = useCallback(
    (file: File) => {
      setError(null);

      // Check file type
      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|ogg|flac|webm|aac|mp4)$/i)) {
        setError("Unsupported format. Please upload MP3, WAV, M4A, OGG, FLAC, WebM, or AAC.");
        return;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setError(`File is too large (${formatFileSize(file.size)}). Maximum size is 500MB.`);
        return;
      }

      setSelectedFile(file);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        validateAndSetFile(file);
      }
    },
    [validateAndSetFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        validateAndSetFile(file);
      }
    },
    [validateAndSetFile]
  );

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 rounded-[var(--radius-sm)] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-[13px] text-red-700 dark:text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {selectedFile ? (
        /* Selected file preview */
        <div className={cn(
          "flex items-center gap-4 p-4",
          "rounded-[var(--radius-lg)] border border-divider",
          "bg-gray-50 dark:bg-surface-dark"
        )}>
          <div className={cn(
            "flex items-center justify-center w-12 h-12",
            "rounded-[var(--radius-sm)] bg-blue-50 dark:bg-blue-900/30",
            "text-blue-600 dark:text-blue-400"
          )}>
            <FileAudio size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body font-bold text-text-dark truncate">
              {selectedFile.name}
            </p>
            <p className="text-[12px] text-text-muted">
              {formatFileSize(selectedFile.size)} • {getExtension(selectedFile.name).toUpperCase()}
            </p>
          </div>
          <button
            onClick={handleRemoveFile}
            className={cn(
              "flex items-center justify-center w-8 h-8",
              "rounded-full text-text-muted",
              "transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
            aria-label="Remove file"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        /* Drop zone */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-3 py-12 px-6",
            "rounded-[var(--radius-lg)] border-2 border-dashed cursor-pointer",
            "transition-all duration-200",
            isDragOver
              ? "border-blue-400 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/10"
              : "border-divider hover:border-text-muted hover:bg-gray-50 dark:hover:bg-surface-dark"
          )}
          role="button"
          tabIndex={0}
          aria-label="Upload audio file"
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
        >
          <div className={cn(
            "flex items-center justify-center w-14 h-14 rounded-full",
            "bg-gray-100 dark:bg-surface-dark",
            "transition-colors",
            isDragOver && "bg-blue-100 dark:bg-blue-900/30"
          )}>
            <Upload
              size={24}
              className={cn(
                "text-text-muted transition-colors",
                isDragOver && "text-blue-500"
              )}
            />
          </div>
          <div className="text-center">
            <p className="text-body font-bold text-text-dark">
              {isDragOver ? "Drop your audio file here" : "Drag & drop audio file"}
            </p>
            <p className="text-[12px] text-text-muted mt-1">
              or click to browse • MP3, WAV, M4A, OGG, FLAC, WebM • Max 500MB
            </p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileInput}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExtension(fileName: string): string {
  return fileName.split(".").pop() || "audio";
}
