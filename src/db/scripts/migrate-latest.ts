import { getMigrator, handleMigration } from './migrator.js';

const migrateToLatest = async () => {
  const { db, migrator } = getMigrator();
  handleMigration(await migrator.migrateToLatest());

  await db.destroy();
};

migrateToLatest();
