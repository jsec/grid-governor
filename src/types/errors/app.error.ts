import { StatusCodes } from 'http-status-codes';
import { NoResultError } from 'kysely';

import type { PostgresError } from './postgres.error.js';

import { isPostgresError } from '../guards.js';

export enum ErrorCode {
  DATABASE_ERROR = 'databaseError',
  NOT_FOUND = 'notFound',
}

export class AppError extends Error {
  code: ErrorCode;

  constructor(code: ErrorCode, message: string, name = 'AppError') {
    super(message);
    this.code = code;
    this.name = name;
  }

  static fromDatabaseError(err: unknown): AppError {
    if (isPostgresError(err)) {
      return AppError.fromPostgresError(err);
    }

    const code = err instanceof NoResultError
      ? ErrorCode.NOT_FOUND
      : ErrorCode.DATABASE_ERROR;

    return AppError.fromError(err as Error, code);
  }

  static fromError(err: Error, code: ErrorCode): AppError {
    return new AppError(code, err.message);
  }

  static fromPostgresError(err: PostgresError): AppError {
    return new AppError(ErrorCode.DATABASE_ERROR, err.detail, err.code);
  }

  get statusCode(): StatusCodes {
    switch (this.code) {
      case ErrorCode.DATABASE_ERROR: {
        return StatusCodes.BAD_REQUEST;
      }
      case ErrorCode.NOT_FOUND: {
        return StatusCodes.NOT_FOUND;
      }
      default: {
        return StatusCodes.INTERNAL_SERVER_ERROR;
      }
    }
  }
}
