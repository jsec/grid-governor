import type { Kysely } from 'kysely';

import { FileMigrationProvider, Migrator } from 'kysely/migration';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { DB } from './types.ts';

const migrationFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

export const migrateToLatest = async (db: Kysely<DB>, migrationTableSchema?: string) => {
    const migrator = new Migrator({
        db,
        migrationTableSchema,
        provider: new FileMigrationProvider({
            fs,
            migrationFolder,
            path,
        }),
    });

    const { error } = await migrator.migrateToLatest();

    if (error) {
        throw error;
    }
};
