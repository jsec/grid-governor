import {
  FileMigrationProvider,
  type MigrationResultSet,
  Migrator,
} from 'kysely';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';

import { db } from '../index.js';

export const getMigrator = () => {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      migrationFolder: path.join(import.meta.dirname, '../migrations'),
      path,
    }),
  });

  return {
    db,
    migrator
  };
};

export const handleMigration = async (migrationResult: MigrationResultSet) => {
  if (migrationResult.results)
    for (const it of migrationResult.results) {
      if (it.status === 'Success') {
        console.log(`migration "${it.migrationName}" was executed successfully`);
      } else if (it.status === 'Error') {
        console.error(`failed to execute migration "${it.migrationName}"`);
      }
    }

  if (migrationResult.error) {
    console.error('failed to migrate');
    console.error(migrationResult.error);
    process.exit(1);
  }
};
