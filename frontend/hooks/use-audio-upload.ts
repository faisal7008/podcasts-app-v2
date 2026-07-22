"use client";

import { useState, useCallback } from "react";

export interface AudioUploadState {
  /** Whether an upload is in progress */
  isUploading: boolean;
  /** Upload progress percentage (0–100) */
  progress: number;
  /** Error message if upload failed */
  error: string | null;
  /** The public URL of the uploaded audio (available after success) */
  uploadedUrl: string | null;
  /** The blob name in Azure storage */
  blobName: string | null;
}

export interface AudioUploadActions {
  uploadAudio: (file: File | Blob, fileName?: string) => Promise<string | null>;
  resetUpload: () => void;
}

export type UseAudioUploadReturn = AudioUploadState & AudioUploadActions;

/**
 * React hook for uploading audio to Azure Blob Storage via SAS URL.
 *
 * Flow:
 * 1. Request a SAS URL from /api/upload/sas-url
 * 2. Upload the file directly to Azure using XHR (for progress tracking)
 * 3. Return the public URL for the uploaded blob
 */
export function useAudioUpload(): UseAudioUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [blobName, setBlobName] = useState<string | null>(null);

  const resetUpload = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
    setUploadedUrl(null);
    setBlobName(null);
  }, []);

  const uploadAudio = useCallback(
    async (file: File | Blob, fileName?: string): Promise<string | null> => {
      try {
        setIsUploading(true);
        setProgress(0);
        setError(null);
        setUploadedUrl(null);
        setBlobName(null);

        // Determine file name and mime type
        const name = fileName || (file instanceof File ? file.name : `recording-${Date.now()}.webm`);
        const mimeType = file.type || "audio/webm";

        // Step 1: Get SAS URL from our API
        const sasResponse = await fetch("/api/upload/sas-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: name,
            mimeType,
            fileSizeBytes: file.size,
          }),
        });

        if (!sasResponse.ok) {
          const sasError = await sasResponse.json();
          throw new Error(sasError.error || "Failed to get upload URL");
        }

        const { sasUrl, publicUrl, blobName: uploadedBlobName } = await sasResponse.json();

        // Step 2: Upload directly to Azure Blob Storage using XHR (for progress)
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const pct = Math.round((event.loaded / event.total) * 100);
              setProgress(pct);
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("Upload failed. Please check your connection and try again."));
          });

          xhr.addEventListener("abort", () => {
            reject(new Error("Upload cancelled"));
          });

          xhr.open("PUT", sasUrl);
          xhr.setRequestHeader("x-ms-blob-type", "BlockBlob");
          xhr.setRequestHeader("Content-Type", mimeType);
          xhr.send(file);
        });

        // Step 3: Success
        setUploadedUrl(publicUrl);
        setBlobName(uploadedBlobName);
        setProgress(100);
        setIsUploading(false);

        return publicUrl;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
        setIsUploading(false);
        setProgress(0);
        return null;
      }
    },
    []
  );

  return {
    isUploading,
    progress,
    error,
    uploadedUrl,
    blobName,
    uploadAudio,
    resetUpload,
  };
}
