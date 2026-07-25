import { BlobServiceClient } from "@azure/storage-blob";
import * as fs from "fs";
import * as path from "path";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
if (!connectionString) {
  throw new Error("AZURE_STORAGE_CONNECTION_STRING environment variable is required");
}

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "podcasts";

export async function downloadBlob(blobName: string, downloadPath: string): Promise<void> {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(blobName);
  await blobClient.downloadToFile(downloadPath);
}

export async function uploadBlob(filePath: string, blobName: string, mimeType: string): Promise<string> {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadFile(filePath, {
    blobHTTPHeaders: { blobContentType: mimeType }
  });
  return blockBlobClient.url;
}

export function extractBlobNameFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/');
    // Assuming format: /<container-name>/<blob-name>
    const name = pathParts.slice(2).join('/');
    return name || null;
  } catch (e) {
    return null;
  }
}
