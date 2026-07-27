import { StorageProvider } from "@podcasts/shared";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
if (!connectionString) {
  throw new Error("AZURE_STORAGE_CONNECTION_STRING environment variable is required");
}

export const storage = new StorageProvider(
  "", // Not used with connection string
  undefined,
  connectionString,
  process.env.AZURE_STORAGE_CONTAINER_NAME || "podcasts"
);

export const downloadBlob = storage.downloadBlob.bind(storage);
export const uploadBlob = storage.uploadBlob.bind(storage);
export const extractBlobNameFromUrl = storage.extractBlobNameFromUrl.bind(storage);
