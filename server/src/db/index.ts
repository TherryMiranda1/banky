import path from "node:path";
import { createRequire } from "node:module";
import { IDatabase, RunResult, StatementItem } from "./interface.js";
import { BetterSqlite3Adapter } from "./sqlite-adapter.js";
import { D1Database, D1DatabaseAdapter } from "./d1-adapter.js";
import { runMigrations } from "./schema.js";

export * from "./interface.js";
export * from "./sqlite-adapter.js";
export * from "./d1-adapter.js";

let defaultDbAdapter: IDatabase | null = null;
let sqliteInstance: unknown = null;

class LazyDatabaseProxy implements IDatabase {
  private get activeDb(): IDatabase {
    if (!defaultDbAdapter) {
      throw new Error("Database not initialized. In Cloudflare Workers, ensure c.env.DB is bound.");
    }
    return defaultDbAdapter;
  }

  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    return this.activeDb.query<T>(sql, params);
  }

  async queryOne<T = unknown>(sql: string, params: unknown[] = []): Promise<T | null> {
    return this.activeDb.queryOne<T>(sql, params);
  }

  async execute(sql: string, params: unknown[] = []): Promise<RunResult> {
    return this.activeDb.execute(sql, params);
  }

  async batch(statements: StatementItem[]): Promise<void> {
    return this.activeDb.batch(statements);
  }

  async rawSql(sql: string): Promise<void> {
    return this.activeDb.rawSql(sql);
  }
}

const lazyProxy = new LazyDatabaseProxy();

export function setDatabase(database: IDatabase): void {
  defaultDbAdapter = database;
}

export function getDatabase(d1OrPath?: D1Database | string): IDatabase {
  if (d1OrPath && typeof d1OrPath === "object" && "prepare" in d1OrPath) {
    defaultDbAdapter = new D1DatabaseAdapter(d1OrPath as D1Database);
    return defaultDbAdapter;
  }

  if (defaultDbAdapter) {
    return defaultDbAdapter;
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
      defaultDbAdapter = new BetterSqlite3Adapter(sqliteInstance as any);
      return defaultDbAdapter;
    }
  } catch {
  }

  return lazyProxy;
}

export function getNativeSqliteDb(): unknown {
  return sqliteInstance;
}
