import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

// Minimal schema for the worker
export const episode = pgTable("Episode", {
  id: text("id").primaryKey(),
  podcastId: text("podcastId").notNull(),
  userId: text("userId").notNull(),
  title: text("title").notNull(),
  duration: integer("duration").default(0),
  rawBlob: text("rawBlob").notNull(),
  processedBlob: text("processedBlob"),
  transcriptBlob: text("transcriptBlob"),
  fileSizeBytes: integer("fileSizeBytes").default(0),
  mimeType: text("mimeType"),
  status: text("status").notNull().default("draft"),
  waveformData: jsonb("waveformData"),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const job = pgTable("Job", {
  id: text("id").primaryKey(),
  episodeId: text("episodeId").notNull(),
  userId: text("userId").notNull(),
  type: text("type").notNull().default("full_pipeline"),
  status: text("status").notNull().default("pending"),
  progress: integer("progress").notNull().default(0),
  error: text("error"),
  updatedAt: timestamp("updatedAt").notNull(),
});

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL?.replace("?sslmode=require", ""),
  ssl: process.env.NODE_ENV === "production" ? (process.env.DATABASE_CA_CERT ? { rejectUnauthorized: true, ca: process.env.DATABASE_CA_CERT.replace(/\\n/g, '\n') } : { rejectUnauthorized: false }) : { rejectUnauthorized: false },
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool);
export { pool };
