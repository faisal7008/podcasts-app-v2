"use client";

import { useState, useCallback } from "react";

export interface ImageUploadState {
  /** Whether an upload is in progress */
  isUploading: boolean;
  /** Upload progress percentage (0–100) */
  progress: number;
  /** Error message if upload failed */
  error: string | null;
  /** The blob path in Azure storage (available after success) */
  blobPath: string | null;
}

export interface ImageUploadActions {
  uploadImage: (
    file: File | Blob,
    type: "podcast" | "episode",
    targetId?: string,
    fileName?: string
  ) => Promise<{ blobPath: string; targetId: string } | null>;
  resetUpload: () => void;
}

export type UseImageUploadReturn = ImageUploadState & ImageUploadActions;

/**
 * React hook for uploading images to Azure Blob Storage via SAS URL.
 */
export function useImageUpload(): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [blobPath, setBlobPath] = useState<string | null>(null);

  const resetUpload = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
    setBlobPath(null);
  }, []);

  const uploadImage = useCallback(
    async (
      file: File | Blob,
      type: "podcast" | "episode",
      targetId?: string,
      fileName?: string
    ): Promise<{ blobPath: string; targetId: string } | null> => {
      try {
        setIsUploading(true);
        setProgress(0);
        setError(null);
        setBlobPath(null);

        // Determine file name and mime type
        const name = fileName || (file instanceof File ? file.name : `image-${Date.now()}.png`);
        const mimeType = file.type || "image/png";

        // Step 1: Get SAS URL + blob path from our API
        const sasResponse = await fetch("/api/upload/image-sas-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: name,
            mimeType,
            fileSizeBytes: file.size,
            type,
            targetId,
          }),
        });

        if (!sasResponse.ok) {
          const sasError = await sasResponse.json();
          throw new Error(sasError.error || "Failed to get upload URL");
        }

        const {
          sasUrl,
          blobPath: uploadedBlobPath,
          targetId: uploadTargetId,
        } = await sasResponse.json();

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

        // Step 3: Success — return blob path
        setBlobPath(uploadedBlobPath);
        setProgress(100);
        setIsUploading(false);

        return { blobPath: uploadedBlobPath, targetId: uploadTargetId };
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
    blobPath,
    uploadImage,
    resetUpload,
  };
}
