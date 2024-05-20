import { NoResultError, QueryNode } from 'kysely';
import {
  describe, expect, test
} from 'vitest';

import { AppError, ErrorCode } from '../../../src/types/errors/app.error.js';
import { type PostgresError, PostgresErrorCode } from '../../../src/types/errors/postgres.error.js';

describe('App Error', () => {
  describe('fromPostgressError', () => {
    test('should create the appropriate AppError for postgres errors', () => {
      const error: PostgresError = {
        code: PostgresErrorCode.ForeignKeyViolation,
        detail: "You can't do that",
        table: 'taybull'
      };

      const appError = AppError.fromPostgresError(error);

      expect(appError).toMatchObject({
        code: ErrorCode.DATABASE_ERROR,
        message: "You can't do that",
        // TODO: fix this
        name: '23503'
      });
    });
  });

  describe('fromDatabaseError', () => {
    test('should shell to the postgres handler for postgres errors', () => {
      const error: PostgresError = {
        code: PostgresErrorCode.ForeignKeyViolation,
        detail: "You can't do that",
        table: 'taybull'
      };

      // TODO: should this be called fromServiceError?
      const appError = AppError.fromDatabaseError(error);

      expect(appError).toMatchObject({
        code: ErrorCode.DATABASE_ERROR,
        message: "You can't do that",
        name: '23503'
      });
    });

    test('should set the error code to NOT_FOUND for kysely NoResultErrors', () => {
      const error = new NoResultError({} as QueryNode);
      const appError = AppError.fromDatabaseError(error);

      expect(appError.code).to.equal(ErrorCode.NOT_FOUND);
    });

    test('should set the error code to DATABASE_ERROR for non-NoResultError types', () => {
      const error = new Error('broken');
      const appError = AppError.fromDatabaseError(error);

      expect(appError.code).to.equal(ErrorCode.DATABASE_ERROR);
    });

    test('should generate an appropriate AppError', () => {
      const error = new Error('things went poorly');
      const appError = AppError.fromDatabaseError(error);

      expect(appError).toMatchObject({
        code: ErrorCode.DATABASE_ERROR,
        message: 'things went poorly',
        name: 'AppError'
      });
    });
  });
});
