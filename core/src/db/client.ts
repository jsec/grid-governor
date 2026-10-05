import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

import type { DB } from './types.ts';

export function createDatabase(connectionString: string): Kysely<DB> {
    return new Kysely<DB>({
        dialect: new PostgresDialect({
            pool: new Pool({ connectionString }),
        }),
        plugins: [new CamelCasePlugin()],
    });
}
