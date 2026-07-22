import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol,
} from "@azure/storage-blob";

// ─── Config ──────────────────────────────────────────────────────────────

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME!;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY!;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "podcasts";

function getCredential() {
  return new StorageSharedKeyCredential(accountName, accountKey);
}

function getBlobServiceClient() {
  return new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    getCredential()
  );
}

// ─── SAS URL Generation ─────────────────────────────────────────────────

/**
 * Generate a time-limited SAS URL for direct browser upload.
 * The browser PUTs the file directly to Azure Blob Storage.
 *
 * @param blobName  - Unique blob path e.g. "userId/uuid/filename.mp3"
 * @param mimeType  - Content-Type header for the blob
 * @param expiresInMinutes - SAS token validity (default 15 min)
 * @returns Object with sasUrl (for upload) and publicUrl (for playback)
 */
export function generateSasUrl(
  blobName: string,
  mimeType: string,
  expiresInMinutes = 15
): { sasUrl: string; publicUrl: string } {
  const startsOn = new Date();
  const expiresOn = new Date(startsOn.getTime() + expiresInMinutes * 60 * 1000);

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("cw"), // create + write
      startsOn,
      expiresOn,
      contentType: mimeType,
      protocol: SASProtocol.Https,
    },
    getCredential()
  ).toString();

  const baseUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`;

  return {
    sasUrl: `${baseUrl}?${sasToken}`,
    publicUrl: baseUrl,
  };
}

/**
 * Generate a time-limited SAS URL for downloading/playing a blob.
 */
export function generateReadSasUrl(
  blobName: string,
  expiresInMinutes = 60
): string {
  const startsOn = new Date();
  const expiresOn = new Date(startsOn.getTime() + expiresInMinutes * 60 * 1000);

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("r"), // read
      startsOn,
      expiresOn,
      protocol: SASProtocol.Https,
    },
    getCredential()
  ).toString();

  const baseUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`;
  return `${baseUrl}?${sasToken}`;
}

/**
 * Helper to extract a blob name from a full Azure storage URL.
 */
export function extractBlobNameFromUrl(url: string): string | null {
  const prefix = `https://${accountName}.blob.core.windows.net/${containerName}/`;
  if (url.startsWith(prefix)) {
    return url.substring(prefix.length).split('?')[0];
  }
  return null;
}

// ─── Public URL ─────────────────────────────────────────────────────────

/**
 * Get the public URL for a stored blob.
 */
export function getPublicUrl(blobName: string): string {
  return `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`;
}

// ─── Delete Blob ────────────────────────────────────────────────────────

/**
 * Delete a blob from storage (e.g. when an episode is deleted).
 */
export async function deleteBlob(blobName: string): Promise<void> {
  const client = getBlobServiceClient();
  const containerClient = client.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(blobName);

  await blobClient.deleteIfExists({ deleteSnapshots: "include" });
}

// ─── Helpers ────────────────────────────────────────────────────────────

/**
 * Generate a unique blob name for an upload.
 * Format: {userId}/{uuid}/{sanitizedFileName}
 */
export function generateBlobName(
  userId: string,
  fileName: string
): string {
  const uuid = crypto.randomUUID();
  const sanitized = fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .toLowerCase();
  return `${userId}/${uuid}/${sanitized}`;
}
