import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol,
} from "@azure/storage-blob";
import * as crypto from "crypto";

export class StorageProvider {
  private client: BlobServiceClient;
  private containerName: string;
  private accountName: string;
  private credential?: StorageSharedKeyCredential;

  constructor(
    accountName: string,
    accountKey?: string,
    connectionString?: string,
    containerName: string = "podcasts"
  ) {
    this.accountName = accountName;
    this.containerName = containerName;

    if (connectionString) {
      this.client = BlobServiceClient.fromConnectionString(connectionString);
    } else if (accountKey) {
      this.credential = new StorageSharedKeyCredential(accountName, accountKey);
      this.client = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        this.credential
      );
    } else {
      throw new Error("Must provide either accountKey or connectionString");
    }
  }

  getContainerClient() {
    return this.client.getContainerClient(this.containerName);
  }

  getBlobClient(blobName: string) {
    return this.getContainerClient().getBlobClient(blobName);
  }

  getBlockBlobClient(blobName: string) {
    return this.getContainerClient().getBlockBlobClient(blobName);
  }

  // ─── SAS URL Generation ─────────────────────────────────────────────────

  generateSasUrl(
    blobName: string,
    mimeType: string,
    expiresInMinutes = 15
  ): { sasUrl: string; publicUrl: string } {
    if (!this.credential) {
      throw new Error("Cannot generate SAS token without StorageSharedKeyCredential");
    }

    const startsOn = new Date();
    const expiresOn = new Date(startsOn.getTime() + expiresInMinutes * 60 * 1000);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: this.containerName,
        blobName,
        permissions: BlobSASPermissions.parse("cw"), // create + write
        startsOn,
        expiresOn,
        contentType: mimeType,
        protocol: SASProtocol.Https,
      },
      this.credential
    ).toString();

    const baseUrl = `https://${this.accountName}.blob.core.windows.net/${this.containerName}/${blobName}`;

    return {
      sasUrl: `${baseUrl}?${sasToken}`,
      publicUrl: baseUrl,
    };
  }

  generateReadSasUrl(blobName: string, expiresInMinutes = 60): string {
    if (!this.credential) {
      throw new Error("Cannot generate SAS token without StorageSharedKeyCredential");
    }

    const startsOn = new Date();
    const expiresOn = new Date(startsOn.getTime() + expiresInMinutes * 60 * 1000);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: this.containerName,
        blobName,
        permissions: BlobSASPermissions.parse("r"), // read
        startsOn,
        expiresOn,
        protocol: SASProtocol.Https,
      },
      this.credential
    ).toString();

    const baseUrl = `https://${this.accountName}.blob.core.windows.net/${this.containerName}/${blobName}`;
    return `${baseUrl}?${sasToken}`;
  }

  // ─── Upload / Download / Delete ─────────────────────────────────────────

  async downloadBlob(blobName: string, downloadPath: string): Promise<void> {
    const blobClient = this.getBlobClient(blobName);
    await blobClient.downloadToFile(downloadPath);
  }

  async uploadBlob(filePath: string, blobName: string, mimeType: string): Promise<string> {
    const blockBlobClient = this.getBlockBlobClient(blobName);
    await blockBlobClient.uploadFile(filePath, {
      blobHTTPHeaders: { blobContentType: mimeType },
    });
    return blockBlobClient.url;
  }

  async deleteBlob(blobName: string): Promise<void> {
    const blobClient = this.getBlobClient(blobName);
    await blobClient.deleteIfExists({ deleteSnapshots: "include" });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  getPublicUrl(blobName: string): string {
    return `https://${this.accountName}.blob.core.windows.net/${this.containerName}/${blobName}`;
  }

  extractBlobNameFromUrl(url: string): string | null {
    try {
      const prefix = `https://${this.accountName}.blob.core.windows.net/${this.containerName}/`;
      if (url.startsWith(prefix)) {
        return url.substring(prefix.length).split("?")[0];
      }
      const parsed = new URL(url);
      const pathParts = parsed.pathname.split("/");
      const name = pathParts.slice(2).join("/");
      return name || null;
    } catch {
      return null;
    }
  }

  static generateBlobName(userId: string, fileName: string): string {
    const uuid = crypto.randomUUID();
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase();
    return `${userId}/${uuid}/${sanitized}`;
  }
}
