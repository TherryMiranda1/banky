import dotenv from "dotenv";
dotenv.config();

import { z } from "zod";

export const envSchema = z.object({
  PRIVATE_KEY_PEM: z.string().min(100, "PRIVATE_KEY_PEM must be at least 100 characters"),
  APP_ID: z.string().uuid("APP_ID must be a valid UUID"),
  ENCRYPTION_KEY: z.string().length(64, "ENCRYPTION_KEY must be a 64-character hex string (32 bytes)"),
  ENABLE_BANKING_REDIRECT_URL: z.string().url("ENABLE_BANKING_REDIRECT_URL must be a valid URL"),
  PORT: z.string().default("3001"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  ENABLE_BANKING_BASE_URL: z.string().url().default("https://api.enablebanking.com"),
  JWT_SECRET: z.string().min(16).default("banky-jwt-super-secret-key-change-in-production"),
  DB_PATH: z.string().optional(),
  NODE_ENV: z.string().default("development")
});

export type Env = z.infer<typeof envSchema>;

let runtimeEnv: Partial<Env> = {};

export function setRuntimeEnv(newEnv: Record<string, unknown>): void {
  runtimeEnv = { ...runtimeEnv, ...(newEnv as Partial<Env>) };
}

export function getRuntimeEnv(): Env {
  return {
    ...env,
    ...runtimeEnv
  };
}

export function parseEnv(source: Record<string, unknown> = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    console.error("❌ Environment validation error:");
    for (const issue of result.error.issues) {
      console.error(`  - Missing/Invalid required env: ${issue.path.join(".")}: ${issue.message}`);
    }
    if (typeof process !== "undefined" && process.exit && process.env.NODE_ENV !== "test") {
      process.exit(1);
    }
  }
  return result.success ? result.data : (source as unknown as Env);
}

export const env: Env = (function () {
  const result = envSchema.safeParse(process.env);
  if (result.success) {
    return result.data;
  }
  return {
    PORT: process.env.PORT || "3001",
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
    ENABLE_BANKING_BASE_URL: process.env.ENABLE_BANKING_BASE_URL || "https://api.enablebanking.com",
    ENABLE_BANKING_REDIRECT_URL: process.env.ENABLE_BANKING_REDIRECT_URL || "http://localhost:5173/auth/callback",
    PRIVATE_KEY_PEM: process.env.PRIVATE_KEY_PEM || "",
    APP_ID: process.env.APP_ID || "00000000-0000-0000-0000-000000000000",
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || "0000000000000000000000000000000000000000000000000000000000000000",
    JWT_SECRET: process.env.JWT_SECRET || "banky-jwt-super-secret-key-change-in-production",
    NODE_ENV: process.env.NODE_ENV || "development"
  };
})();
