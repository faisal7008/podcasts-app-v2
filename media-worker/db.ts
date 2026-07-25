import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

// Minimal schema for the worker
export const episode = pgTable("Episode", {
  id: text("id").primaryKey(),
  podcastId: text("podcastId").notNull(),
  userId: text("userId").notNull(),
  title: text("title").notNull(),
  duration: integer("duration").default(0),
  audioUrl: text("audioUrl").notNull(),
  fileSizeBytes: integer("fileSizeBytes").default(0),
  mimeType: text("mimeType"),
  status: text("status").notNull().default("draft"),
  waveformData: text("waveformData"),
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
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool);
export { pool };
