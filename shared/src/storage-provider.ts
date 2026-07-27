/**
 * storage-provider.ts — Low-level Azure Blob Storage wrapper.
 *
 * Responsibilities:
 *  - Connect to Azure Blob Storage (Connection String or Account Key)
 *  - Upload / Download / Delete blobs
 *  - Generate SAS URLs (upload + read)
 *  - List blobs by prefix
 *  - Delete all blobs under a prefix
 *  - Get blob clients
 *
 * No application-specific logic lives here.
 */

import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol,
  ContainerClient,
  BlockBlobClient,
  BlobClient,
  BlockBlobUploadOptions,
  BlockBlobUploadStreamOptions,
} from "@azure/storage-blob";
import { Readable } from "stream";

// ─── Custom Error ──────────────────────────────────────────────────────────────

export class StorageError extends Error {
  /** The underlying Azure SDK error, if any */
  public readonly cause?: Error;
  /** The blob name involved, if any */
  public readonly blobName?: string;
  /** HTTP status code from Azure, if available */
  public readonly statusCode?: number;

  constructor(
    message: string,
    opts?: { cause?: Error; blobName?: string; statusCode?: number }
  ) {
    super(message);
    this.name = "StorageError";
    this.cause = opts?.cause;
    this.blobName = opts?.blobName;
    this.statusCode = opts?.statusCode;
  }
}

// ─── Blob Metadata Types ───────────────────────────────────────────────────────

/** Arbitrary string key-value metadata attached to a blob. */
export type BlobMetadata = Record<string, string>;

// ─── StorageProvider ───────────────────────────────────────────────────────────

export class StorageProvider {
  private client: BlobServiceClient;
  private containerName: string;
  private accountName: string;
  private credential?: StorageSharedKeyCredential;

  constructor(opts: {
    accountName: string;
    accountKey?: string;
    connectionString?: string;
    containerName?: string;
  }) {
    const {
      accountName,
      accountKey,
      connectionString,
      containerName = "podcasts",
    } = opts;

    this.accountName = accountName;
    this.containerName = containerName;

    if (connectionString) {
      this.client = BlobServiceClient.fromConnectionString(connectionString);
      // Extract credential from connection string for SAS generation
      const match = connectionString.match(/AccountName=([^;]+)/);
      const keyMatch = connectionString.match(/AccountKey=([^;]+)/);
      if (match && keyMatch) {
        this.accountName = match[1];
        this.credential = new StorageSharedKeyCredential(match[1], keyMatch[1]);
      }
    } else if (accountKey) {
      this.credential = new StorageSharedKeyCredential(accountName, accountKey);
      this.client = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        this.credential
      );
    } else {
      throw new StorageError(
        "Must provide either accountKey or connectionString"
      );
    }
  }

  // ─── Container / Client Accessors ──────────────────────────────────────────

  getContainerClient(): ContainerClient {
    return this.client.getContainerClient(this.containerName);
  }

  getBlobClient(blobName: string): BlobClient {
    return this.getContainerClient().getBlobClient(blobName);
  }

  getBlockBlobClient(blobName: string): BlockBlobClient {
    return this.getContainerClient().getBlockBlobClient(blobName);
  }

  // ─── Container Management ─────────────────────────────────────────────────

  /**
   * Create the container if it doesn't already exist.
   * Safe to call on every startup.
   */
  async ensureContainer(): Promise<void> {
    try {
      await this.getContainerClient().createIfNotExists();
    } catch (err) {
      throw new StorageError("Failed to ensure container exists", {
        cause: err instanceof Error ? err : undefined,
      });
    }
  }

  // ─── Blob Existence ───────────────────────────────────────────────────────

  /**
   * Check whether a blob exists.
   */
  async blobExists(blobName: string): Promise<boolean> {
    try {
      return await this.getBlobClient(blobName).exists();
    } catch (err) {
      throw new StorageError(`Failed to check existence of blob`, {
        cause: err instanceof Error ? err : undefined,
        blobName,
      });
    }
  }

  // ─── List / Prefix Operations ─────────────────────────────────────────────

  /**
   * List all blob names under a given prefix.
   * Useful for discovering all assets under `episodes/{id}/`.
   */
  async listBlobs(prefix: string): Promise<string[]> {
    try {
      const container = this.getContainerClient();
      const names: string[] = [];
      for await (const blob of container.listBlobsFlat({ prefix })) {
        names.push(blob.name);
      }
      return names;
    } catch (err) {
      throw new StorageError(`Failed to list blobs with prefix "${prefix}"`, {
        cause: err instanceof Error ? err : undefined,
      });
    }
  }

  /**
   * Delete all blobs under a given prefix.
   * Use for cleaning up all episode or podcast assets in one call.
   *
   * Example: `deletePrefix("episodes/ep123/")` removes everything under that folder.
   */
  async deletePrefix(prefix: string): Promise<number> {
    try {
      const blobs = await this.listBlobs(prefix);
      const container = this.getContainerClient();

      await Promise.all(
        blobs.map((name) =>
          container.getBlobClient(name).deleteIfExists({ deleteSnapshots: "include" })
        )
      );

      return blobs.length;
    } catch (err) {
      throw new StorageError(`Failed to delete blobs with prefix "${prefix}"`, {
        cause: err instanceof Error ? err : undefined,
      });
    }
  }

  // ─── SAS URL Generation ───────────────────────────────────────────────────

  /**
   * Generate an Upload SAS URL (create + write permissions).
   * Includes 5-minute clock skew allowance.
   */
  generateUploadSasUrl(
    blobName: string,
    mimeType: string,
    expiresInMinutes = 15
  ): { sasUrl: string; blobPath: string } {
    if (!this.credential) {
      throw new StorageError(
        "Cannot generate SAS token without StorageSharedKeyCredential",
        { blobName }
      );
    }

    const now = new Date();
    const startsOn = new Date(now.getTime() - 5 * 60 * 1000); // 5-min clock skew
    const expiresOn = new Date(
      now.getTime() + expiresInMinutes * 60 * 1000
    );

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
      blobPath: blobName,
    };
  }

  /**
   * Generate a Read SAS URL (read permission only).
   * Includes 5-minute clock skew allowance.
   */
  generateReadSasUrl(blobName: string, expiresInMinutes = 60): string {
    if (!this.credential) {
      throw new StorageError(
        "Cannot generate SAS token without StorageSharedKeyCredential",
        { blobName }
      );
    }

    const now = new Date();
    const startsOn = new Date(now.getTime() - 5 * 60 * 1000); // 5-min clock skew
    const expiresOn = new Date(
      now.getTime() + expiresInMinutes * 60 * 1000
    );

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

  // ─── Upload ───────────────────────────────────────────────────────────────

  /**
   * Upload a local file to blob storage.
   */
  async uploadFile(
    filePath: string,
    blobName: string,
    mimeType: string,
    metadata?: BlobMetadata
  ): Promise<string> {
    try {
      const blockBlobClient = this.getBlockBlobClient(blobName);
      const options: BlockBlobUploadOptions = {
        blobHTTPHeaders: { blobContentType: mimeType },
        metadata,
      };
      await blockBlobClient.uploadFile(filePath, options);
      return blobName;
    } catch (err) {
      throw new StorageError(`Failed to upload file to blob`, {
        cause: err instanceof Error ? err : undefined,
        blobName,
      });
    }
  }

  /**
   * Upload a Buffer to blob storage.
   */
  async uploadBuffer(
    buffer: Buffer,
    blobName: string,
    mimeType: string,
    metadata?: BlobMetadata
  ): Promise<string> {
    try {
      const blockBlobClient = this.getBlockBlobClient(blobName);
      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: { blobContentType: mimeType },
        metadata,
      });
      return blobName;
    } catch (err) {
      throw new StorageError(`Failed to upload buffer to blob`, {
        cause: err instanceof Error ? err : undefined,
        blobName,
      });
    }
  }

  /**
   * Upload a readable stream to blob storage.
   */
  async uploadStream(
    stream: Readable,
    blobName: string,
    mimeType: string,
    bufferSize = 4 * 1024 * 1024, // 4 MB
    maxConcurrency = 4,
    metadata?: BlobMetadata
  ): Promise<string> {
    try {
      const blockBlobClient = this.getBlockBlobClient(blobName);
      const options: BlockBlobUploadStreamOptions = {
        blobHTTPHeaders: { blobContentType: mimeType },
        metadata,
      };
      await blockBlobClient.uploadStream(
        stream,
        bufferSize,
        maxConcurrency,
        options
      );
      return blobName;
    } catch (err) {
      throw new StorageError(`Failed to upload stream to blob`, {
        cause: err instanceof Error ? err : undefined,
        blobName,
      });
    }
  }

  // ─── Download ─────────────────────────────────────────────────────────────

  /**
   * Download a blob to a local file.
   */
  async downloadToFile(blobName: string, downloadPath: string): Promise<void> {
    try {
      const blobClient = this.getBlobClient(blobName);
      await blobClient.downloadToFile(downloadPath);
    } catch (err) {
      throw new StorageError(`Failed to download blob to file`, {
        cause: err instanceof Error ? err : undefined,
        blobName,
      });
    }
  }

  /**
   * Download a blob's contents into a Buffer.
   */
  async downloadToBuffer(blobName: string): Promise<Buffer> {
    try {
      const blobClient = this.getBlobClient(blobName);
      return await blobClient.downloadToBuffer();
    } catch (err) {
      throw new StorageError(`Failed to download blob to buffer`, {
        cause: err instanceof Error ? err : undefined,
        blobName,
      });
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  /**
   * Delete a single blob (no-op if it doesn't exist).
   */
  async deleteBlob(blobName: string): Promise<void> {
    try {
      const blobClient = this.getBlobClient(blobName);
      await blobClient.deleteIfExists({ deleteSnapshots: "include" });
    } catch (err) {
      throw new StorageError(`Failed to delete blob`, {
        cause: err instanceof Error ? err : undefined,
        blobName,
      });
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Extract the blob name from a full Azure Blob Storage URL.
   * Handles encoded blob names (e.g. spaces → %20).
   */
  extractBlobNameFromUrl(url: string): string | null {
    try {
      const prefix = `https://${this.accountName}.blob.core.windows.net/${this.containerName}/`;
      if (url.startsWith(prefix)) {
        const raw = url.substring(prefix.length).split("?")[0];
        return decodeURIComponent(raw);
      }
      const parsed = new URL(url);
      const pathParts = parsed.pathname.split("/");
      const name = pathParts.slice(2).join("/");
      return name ? decodeURIComponent(name) : null;
    } catch {
      return null;
    }
  }
}
