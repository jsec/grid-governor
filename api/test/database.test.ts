import { describe, expect, it } from 'vitest';

import { assertDedicatedDatabase } from './database.ts';

describe('database test target safety', () => {
    it.each([
        'postgresql://other:password@localhost/gridgov?application_name=test',
        'postgresql://user@LOCALHOST:5432/gridgov',
    ])('rejects the same database with different connection settings: %s', (target) => {
        expect(() => assertDedicatedDatabase(target, 'postgresql://owner@localhost:5432/gridgov'))
            .toThrow(/must not identify/);
    });

    it('permits a different database on the same server', () => {
        expect(() => assertDedicatedDatabase('postgresql://user@localhost/grid_governor_auth_test', 'postgresql://user@localhost/gridgov'))
            .not.toThrow();
    });
});
