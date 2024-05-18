import type { PostgresError } from './database.errors.js';

export enum ErrorCode {
  DATABASE_ERROR = 'databaseError',
  NOT_FOUND = 'notFound'
}

export class AppError extends Error {
  code: ErrorCode;

  constructor(code: ErrorCode, message: string, name = 'AppError') {
    super(message);
    this.code = code;
    this.name = name;
  }

  static fromError(err: Error, code: ErrorCode): AppError {
    return new AppError(code, err.message);
  }

  static fromPostgresError(err: PostgresError): AppError {
    return new AppError(ErrorCode.DATABASE_ERROR, err.detail, err.code);
  }
}
