import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

import type { DB } from './types.js';

export function createDatabase(connectionString: string): Kysely<DB> {
    return new Kysely<DB>({
        dialect: new PostgresDialect({
            pool: new Pool({ connectionString }),
        }),
    });
}
