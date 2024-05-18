import {
  describe, expect, test
} from 'vitest';

import { isRecord } from '../../src/types/guards.js';

describe.only('Type guards', () => {
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
      const nullValue = null;
      expect(isRecord(nullValue)).to.be.false;
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
});
