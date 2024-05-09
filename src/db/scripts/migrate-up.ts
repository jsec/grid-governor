import { getMigrator, handleMigration } from './migrator.js';

const migrateUp = async () => {
  const { db, migrator } = getMigrator();
  handleMigration(await migrator.migrateUp());

  await db.destroy();
};

migrateUp();
