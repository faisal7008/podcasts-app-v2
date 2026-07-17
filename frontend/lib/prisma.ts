import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  // Strip ?sslmode=require so it doesn't override our manual ssl config
  const connectionString = process.env.DATABASE_URL?.replace("?sslmode=require", "");
  // idleTimeoutMillis: 1000 prevents the Node process from hanging 
  // indefinitely in CLI tools (like better-auth generate).
  const pool = new Pool({
    connectionString,
    idleTimeoutMillis: 1000,
    ssl: {
      rejectUnauthorized: false,
    },
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

/**
 * Singleton Prisma client.
 * In development, reuse the same client across hot reloads to avoid
 * exhausting the database connection pool.
 *
 * Imports from the custom generated output path set in schema.prisma.
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
