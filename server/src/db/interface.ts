export interface RunResult {
  changes: number;
  lastInsertRowid?: number | bigint;
}

export interface StatementItem {
  sql: string;
  params?: unknown[];
}

export interface IDatabase {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null>;
  execute(sql: string, params?: unknown[]): Promise<RunResult>;
  batch(statements: StatementItem[]): Promise<void>;
  rawSql(sql: string): Promise<void>;
}
