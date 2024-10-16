import {
  describe,
  expect,
  test
} from 'vitest';

import { type PostgresError, PostgresErrorCode } from '../../src/types/errors/postgres.error.js';
import { isPostgresError, isRecord } from '../../src/types/guards.js';

describe('Type guards', () => {
  describe('isRecord', () => {
    test('should return false if the value is an array', () => {
      const value = [ 3 ];
      expect(isRecord(value)).to.be.false;
    });

    test('should return false if the value is an array of objects', () => {
      const value = [
        {
          text: 'hi'
        }
      ];

      expect(isRecord(value)).to.be.false;
    });

    test('should return false if the value is null', () => {
      // eslint-disable-next-line unicorn/no-null
      expect(isRecord(null)).to.be.false;
    });

    test('should return false if the value is a primitive', () => {
      expect(isRecord('string')).to.be.false;
    });

    test('should return true if the value is an object', () => {
      const value = {
        text: ' some value'
      };

      expect(isRecord(value)).to.be.true;
    });
  });

  describe('isPostgresError', () => {
    test('should return false for regular JavaScript errors', () => {
      const error = new Error('some generic error');
      expect(isPostgresError(error)).to.be.false;
    });

    test('should return true for a ForeignKeyViolation error', () => {
      const error: PostgresError = {
        code: PostgresErrorCode.ForeignKeyViolation,
        column: '12',
        detail: 'you cannot do that, mmkay?',
        table: 'taybull'
      };

      expect(isPostgresError(error)).to.be.true;
    });
  });
});

