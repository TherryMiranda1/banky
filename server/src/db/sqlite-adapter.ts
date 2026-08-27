import type Database from "better-sqlite3";
import { IDatabase, RunResult, StatementItem } from "./interface.js";

export class BetterSqlite3Adapter implements IDatabase {
  constructor(private readonly db: Database.Database) {}

  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as T[];
  }

  async queryOne<T = unknown>(sql: string, params: unknown[] = []): Promise<T | null> {
    const stmt = this.db.prepare(sql);
    const row = stmt.get(...params);
    return (row as T) || null;
  }

  async execute(sql: string, params: unknown[] = []): Promise<RunResult> {
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...params);
    return {
      changes: result.changes,
      lastInsertRowid: result.lastInsertRowid
    };
  }

  async batch(statements: StatementItem[]): Promise<void> {
    const txn = this.db.transaction(() => {
      for (const item of statements) {
        const stmt = this.db.prepare(item.sql);
        stmt.run(...(item.params || []));
      }
    });
    txn();
  }

  async rawSql(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  getNativeDb(): Database.Database {
    return this.db;
  }
}
