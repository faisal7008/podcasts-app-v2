import { StorageProvider, StorageService } from "@podcasts/shared";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
if (!connectionString) {
  throw new Error("AZURE_STORAGE_CONNECTION_STRING environment variable is required");
}

const provider = new StorageProvider({
  accountName: "", // Extracted from connection string
  connectionString,
  containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || "podcasts",
});

export const storageService = new StorageService(provider);
export const storageProvider = provider;
