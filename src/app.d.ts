declare global {
  namespace App {
    interface Platform {
      env: {
        DB: D1Database;
        ADMIN_PASSWORD?: string;
        SESSION_SECRET?: string;
      };
    }
    interface Locals {
      access?: {
        groupId: string;
        participantId?: string;
      };
      admin?: boolean;
    }
  }

  interface D1Database {
    prepare(query: string): D1PreparedStatement;
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
    exec(query: string): Promise<D1ExecResult>;
  }

  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = Record<string, unknown>>(columnName?: string): Promise<T | null>;
    all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
    run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  }

  interface D1Result<T = unknown> {
    results?: T[];
    success: boolean;
    meta: Record<string, unknown>;
    error?: string;
  }

  interface D1ExecResult {
    count: number;
    duration: number;
  }
}

export {};
