import { IDatabase, RunResult, StatementItem } from "./interface.js";

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = unknown>(): Promise<{ results?: T[]; success: boolean }>;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<{ success: boolean; meta: { changes?: number; last_row_id?: number } }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<Array<{ results?: T[]; success: boolean }>>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

export class D1DatabaseAdapter implements IDatabase {
  constructor(private readonly d1: D1Database) {}

  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    const stmt = params.length > 0 ? this.d1.prepare(sql).bind(...params) : this.d1.prepare(sql);
    const result = await stmt.all<T>();
    return result.results || [];
  }

  async queryOne<T = unknown>(sql: string, params: unknown[] = []): Promise<T | null> {
    const stmt = params.length > 0 ? this.d1.prepare(sql).bind(...params) : this.d1.prepare(sql);
    const result = await stmt.first<T>();
    return result || null;
  }

  async execute(sql: string, params: unknown[] = []): Promise<RunResult> {
    const stmt = params.length > 0 ? this.d1.prepare(sql).bind(...params) : this.d1.prepare(sql);
    const result = await stmt.run();
    return {
      changes: result.meta?.changes ?? 0,
      lastInsertRowid: result.meta?.last_row_id
    };
  }

  async batch(statements: StatementItem[]): Promise<void> {
    const prepared = statements.map((item) => {
      const p = item.params || [];
      return p.length > 0 ? this.d1.prepare(item.sql).bind(...p) : this.d1.prepare(item.sql);
    });
    await this.d1.batch(prepared);
  }

  async rawSql(sql: string): Promise<void> {
    await this.d1.exec(sql);
  }
}
