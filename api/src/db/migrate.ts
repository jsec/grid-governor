import type { Kysely } from 'kysely';

import { FileMigrationProvider, Migrator } from 'kysely/migration';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { DB } from './types.js';

export const createMigrator = (db: Kysely<DB>) => {
    const migrationPath = path.dirname(fileURLToPath(import.meta.url));
    const migrationFolder = path.join(migrationPath, 'migrations');

    return new Migrator({
        db,
        provider: new FileMigrationProvider({
            fs,
            migrationFolder,
            path,
        }),
    });
};

export const runMigrations = async (migrator: Migrator) => {
    const { error } = await migrator.migrateToLatest();

    if (error) {
        throw error;
    }
};
