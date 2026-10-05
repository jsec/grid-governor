import type { TestProject } from 'vitest/node';

import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { inject } from 'vitest';

import { createDatabase } from '../db/client.ts';
import { migrateToLatest } from '../db/migrate.ts';

declare module 'vitest' {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    export interface ProvidedContext {
        postgresUrl: string;
    }
}

const templateName = 'migrated_template';

export type TestDatabase = Awaited<ReturnType<typeof createTestDatabase>>;

export async function createTestDatabase() {
    const serverUrl = inject('postgresUrl');
    const name = `test_${randomUUID().replaceAll('-', '')}`;

    await runStatement(serverUrl, `CREATE DATABASE "${name}" TEMPLATE ${templateName}`);

    const db = createDatabase(databaseUrl(serverUrl, name));

    return {
        db,
        async destroy() {
            await db.destroy();
            await runStatement(serverUrl, `DROP DATABASE "${name}" WITH (FORCE)`);
        },
    };
}

export async function setup(project: TestProject) {
    const container = await new PostgreSqlContainer('postgres:18-alpine').start();
    const serverUrl = container.getConnectionUri();

    await runStatement(serverUrl, `CREATE DATABASE ${templateName}`);

    const template = createDatabase(databaseUrl(serverUrl, templateName));

    try {
        await migrateToLatest(template);
    } finally {
        await template.destroy();
    }

    project.provide('postgresUrl', serverUrl);

    return async () => {
        await container.stop();
    };
}

function databaseUrl(serverUrl: string, database: string): string {
    const url = new URL(serverUrl);
    url.pathname = `/${database}`;

    return url.href;
}

async function runStatement(connectionString: string, statement: string) {
    const client = new Client({ connectionString });
    await client.connect();

    try {
        await client.query(statement);
    } finally {
        await client.end();
    }
}
