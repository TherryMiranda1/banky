import path from "node:path";
import { createRequire } from "node:module";
import { drizzle as drizzleD1, DrizzleD1Database } from "drizzle-orm/d1";
import { drizzle as drizzleBetterSqlite3, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import * as schema from "./schema.js";
import { runMigrations } from "./schema.js";

export * from "./schema.js";
export * from "drizzle-orm";

export interface D1Database {
  prepare(query: string): {
    bind(...params: unknown[]): unknown;
    all<T = unknown>(): Promise<{ results: T[] }>;
    run(): Promise<{ success: boolean; meta: unknown }>;
  };
  batch(statements: unknown[]): Promise<unknown[]>;
  exec(query: string): Promise<unknown>;
}

export type AppDatabase = BaseSQLiteDatabase<"async" | "sync", any, typeof schema>;

let defaultDb: AppDatabase | null = null;
let sqliteInstance: unknown = null;

export function setDb(database: AppDatabase): void {
  defaultDb = database;
}

export function getDb(d1OrPath?: D1Database | string): AppDatabase {
  if (d1OrPath && typeof d1OrPath === "object" && "prepare" in d1OrPath) {
    defaultDb = drizzleD1(d1OrPath as any, { schema }) as unknown as AppDatabase;
    return defaultDb;
  }

  if (defaultDb) {
    return defaultDb;
  }

  try {
    const isNode = typeof process !== "undefined" && process.versions && process.versions.node;
    if (isNode) {
      const require = createRequire(import.meta.url);
      const DatabaseModule = require("better-sqlite3");
      const dbPath =
        typeof d1OrPath === "string"
          ? d1OrPath
          : (process.env && process.env.DB_PATH) || path.resolve(process.cwd(), "banky.db");
      sqliteInstance = new DatabaseModule(dbPath);
      runMigrations(sqliteInstance as any);
      defaultDb = drizzleBetterSqlite3(sqliteInstance as any, { schema }) as unknown as AppDatabase;
      return defaultDb;
    }
  } catch {
  }

  if (!defaultDb) {
    throw new Error("Database not initialized. In Cloudflare Workers, ensure c.env.DB is bound.");
  }

  return defaultDb;
}

export const getDatabase = getDb;

export function getNativeSqliteDb(): unknown {
  return sqliteInstance;
}
