import type { PostgresError } from './errors/postgres.error.js';

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

export const isPostgresError = (err: unknown): err is PostgresError => {
  if (!isRecord(err)) {
    return false;
  }

  const {
    code, detail, table
  } = err;

  return Boolean(code && detail && table);
};
