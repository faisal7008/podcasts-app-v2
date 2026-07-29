import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!.includes("sslmode") 
      ? process.env.DATABASE_URL! 
      : `${process.env.DATABASE_URL}?sslmode=require`,
    ssl: process.env.DATABASE_CA_CERT 
      ? { rejectUnauthorized: true, ca: process.env.DATABASE_CA_CERT.replace(/\\n/g, '\n') } 
      : { rejectUnauthorized: false },
  },
});
