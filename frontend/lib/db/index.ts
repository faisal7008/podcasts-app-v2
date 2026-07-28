import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const poolConfig = {
  connectionString: process.env.DATABASE_URL?.replace("?sslmode=require", ""),
  ssl: process.env.NODE_ENV === "production" 
    ? (process.env.DATABASE_CA_CERT 
        ? { rejectUnauthorized: true, ca: process.env.DATABASE_CA_CERT } 
        : { rejectUnauthorized: false }) 
    : { rejectUnauthorized: false },
};

// Cache the database connection in development. This prevents exhausting database connections
// during hot module reloading in Next.js, which creates new connections on every reload.
const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

const pool = globalForDb.pool ?? new Pool(poolConfig);

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema });
