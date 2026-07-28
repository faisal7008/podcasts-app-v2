import { StorageProvider, StorageService } from "@podcasts/shared";

// Initialize the low-level provider
const provider = new StorageProvider({
  accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME!,
  accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY!,
  containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || "podcasts",
});

// Application-level storage service (used by API routes)
export const storageService = new StorageService(provider);

// Re-export provider for any low-level needs
export const storageProvider = provider;
