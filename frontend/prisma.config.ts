import "dotenv/config";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma 7+ configuration file.
 * Loads environment variables from .env file.
 */
export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    url: env("DATABASE_URL"),
  },
});
