import type { DatabaseError } from './errors/database.errors.js';

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

export const isDatabaseError = (err: unknown): err is DatabaseError => {
  if (!isRecord(err)) {
    return false;
  }

  const {
    code, detail, table
  } = err;

  return Boolean(code && detail && table);
};
