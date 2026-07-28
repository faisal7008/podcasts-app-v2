import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.string().regex(/^\d+$/).default("6379"),
  REDIS_PASSWORD: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  TADDY_USER_ID: z.string().min(1),
  TADDY_API_KEY: z.string().min(1),
  AZURE_STORAGE_ACCOUNT_NAME: z.string().min(1),
  AZURE_STORAGE_ACCOUNT_KEY: z.string().min(1),
  AZURE_STORAGE_CONTAINER_NAME: z.string().default("podcasts"),
  DATABASE_CA_CERT: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error(
    "❌ Invalid environment variables:",
    _env.error.flatten().fieldErrors
  );
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
