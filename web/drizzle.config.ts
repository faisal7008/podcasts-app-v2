import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: process.env.NODE_ENV === "production" ? (process.env.DATABASE_CA_CERT ? { rejectUnauthorized: true, ca: process.env.DATABASE_CA_CERT } : true) : { rejectUnauthorized: false },
  },
});
