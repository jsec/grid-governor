import type { DB } from '@grid-governor/core/db/types';

import { migrateToLatest } from '@grid-governor/core/db/migrate';
import { Kysely, PostgresDialect } from 'kysely';
import { randomUUID } from 'node:crypto';
import { Client, Pool } from 'pg';
import { describe } from 'vitest';

const testUrl = process.env.TEST_DATABASE_URL;

export const dbTests = testUrl ? describe : describe.skip;

export type TestDatabase = Awaited<ReturnType<typeof createTestDatabase>>;

export function assertDedicatedDatabase(test: string, development?: string): void {
    if (development && target(test) === target(development)) {
        throw new Error('TEST_DATABASE_URL must not identify the DATABASE_URL target');
    }
}

export async function createTestDatabase() {
    if (!testUrl) {
        throw new Error('TEST_DATABASE_URL is required');
    }

    assertDedicatedDatabase(testUrl, process.env.DATABASE_URL);
    const schemaName = `auth_test_${randomUUID().replaceAll('-', '')}`;

    await withClient(testUrl, async (client) => {
        await client.query('BEGIN');
        try {
            // Serialize database-wide extension creation across Vitest workers.
            await client.query('SELECT pg_advisory_xact_lock(714209184)');
            await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public');
            await client.query(`CREATE SCHEMA "${schemaName}"`);
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
    });

    const pool = new Pool({
        connectionString: testUrl,
        max: 1,
        options: `-c search_path=${schemaName},public`,
    });
    const db = new Kysely<DB>({ dialect: new PostgresDialect({ pool }) });

    await migrateToLatest(db, schemaName);

    return {
        db,
        async destroy() {
            await db.destroy();
            await withClient(testUrl, async (client) => {
                await client.query(`DROP SCHEMA "${schemaName}" CASCADE`);
            });
        },
    };
}

function target(value: string): string {
    const url = new URL(value);

    return [
        url.hostname.toLowerCase(),
        url.port || '5432',
        decodeURIComponent(url.pathname),
    ].join('|');
}

async function withClient(connectionString: string, run: (client: Client) => Promise<unknown>) {
    const client = new Client({ connectionString });
    await client.connect();

    try {
        await run(client);
    } finally {
        await client.end();
    }
}
