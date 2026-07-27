import { StorageProvider } from "@podcasts/shared";

export const storage = new StorageProvider(
  process.env.AZURE_STORAGE_ACCOUNT_NAME!,
  process.env.AZURE_STORAGE_ACCOUNT_KEY!,
  undefined,
  process.env.AZURE_STORAGE_CONTAINER_NAME || "podcasts"
);

export const generateSasUrl = storage.generateSasUrl.bind(storage);
export const generateReadSasUrl = storage.generateReadSasUrl.bind(storage);
export const extractBlobNameFromUrl = storage.extractBlobNameFromUrl.bind(storage);
export const getPublicUrl = storage.getPublicUrl.bind(storage);
export const deleteBlob = storage.deleteBlob.bind(storage);
export const generateBlobName = StorageProvider.generateBlobName;
