"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, ImageIcon, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Max file size: 10MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

interface ImageUploaderProps {
  /** Called when a valid file is selected or removed (null) */
  onFileSelected: (file: File | null) => void;
  /** Label for the drop zone */
  label?: string;
  /** Optional initial image URL (e.g. when editing) */
  initialImageUrl?: string | null;
}

/**
 * Drag-and-drop image file uploader with validation and preview.
 * Validates file type and size before passing to parent.
 */
export function ImageUploader({ onFileSelected, label = "Upload Image", initialImageUrl }: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const validateAndSetFile = useCallback(
    (file: File) => {
      setError(null);

      // Check file type
      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(png|jpg|jpeg|webp)$/i)) {
        setError("Unsupported format. Please upload PNG, JPG, or WEBP.");
        return;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setError(`File is too large (${formatFileSize(file.size)}). Maximum size is 10MB.`);
        return;
      }

      setSelectedFile(file);
      onFileSelected(file);
      
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
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

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    onFileSelected(null);
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

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 w-40 h-40",
          "rounded-[var(--radius-lg)] border-2 border-dashed cursor-pointer",
          "transition-all duration-200 overflow-hidden",
          isDragOver
            ? "border-blue-400 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/10"
            : "border-divider hover:border-text-muted hover:bg-gray-50 dark:hover:bg-surface-dark"
        )}
        role="button"
        tabIndex={0}
        aria-label={label}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
      >
        {previewUrl ? (
          <>
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={handleRemoveFile}
                className={cn(
                  "flex items-center justify-center w-8 h-8",
                  "rounded-full bg-white/20 text-white hover:bg-white/40",
                  "transition-colors"
                )}
                aria-label="Remove file"
              >
                <X size={16} />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full",
              "bg-gray-100 dark:bg-surface-dark",
              "transition-colors",
              isDragOver && "bg-blue-100 dark:bg-blue-900/30"
            )}>
              <Upload
                size={20}
                className={cn(
                  "text-text-muted transition-colors",
                  isDragOver && "text-blue-500"
                )}
              />
            </div>
            <div className="text-center px-2">
              <p className="text-[13px] font-bold text-text-dark">
                {label}
              </p>
              <p className="text-[11px] text-text-muted mt-1">
                PNG, JPG • Max 10MB
              </p>
            </div>
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
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
