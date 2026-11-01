import { stripVTControlCharacters } from 'node:util';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { prettify } from './tty.ts';

const base = {
    level: 'info',
    msg: 'league created',
    release: 'a1b2c3d',
    service: 'api',
    time: '2026-10-04T21:14:03.512Z',
};

function format(fields: Record<string, unknown>): string {
    return stripVTControlCharacters(prettify(JSON.stringify({ ...base, ...fields })));
}

describe('prettify', () => {
    it('should print the time, level, message and fields', () => {
        const result = format({
            league_id: '42',
            user_id: 'u_3',
        });

        expect(result).toBe('21:14:03 INFO  league created league_id=42 user_id=u_3');
    });

    it('should print nothing after the message when there are no other fields', () => {
        expect(format({})).toBe('21:14:03 INFO  league created');
    });

    it('should pad every level to the same width', () => {
        expect(format({ level: 'warn' })).toBe('21:14:03 WARN  league created');
        expect(format({ level: 'error' })).toBe('21:14:03 ERROR league created');
        expect(format({ level: 'debug' })).toBe('21:14:03 DEBUG league created');
    });

    it('should quote strings with spaces and print other values as JSON', () => {
        expect(format({
            count: 3,
            name: 'Grid Club',
            roles: ['owner', 'admin'],
            scope: { league_id: '42' },
            verified: true,
        })).toBe('21:14:03 INFO  league created'
            + ' count=3 name="Grid Club" roles=["owner","admin"]'
            + ' scope={"league_id":"42"} verified=true');
    });

    it('should print an error stack on indented lines after the message', () => {
        expect(format({
            err: {
                message: 'connection refused',
                stack: 'Error: connection refused\n    at connect (db.ts:4:2)',
                type: 'Error',
            },
            level: 'error',
            request_id: 'r_1',
        })).toBe('21:14:03 ERROR league created request_id=r_1\n'
            + '  Error: connection refused\n'
            + '      at connect (db.ts:4:2)');
    });

    it('should reject a line without the fields createLogger always writes', () => {
        expect(() => prettify(JSON.stringify({ msg: 'no level' }))).toThrow(z.ZodError);
    });
});
