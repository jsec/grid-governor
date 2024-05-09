import { getMigrator, handleMigration } from './migrator.js';

const migrateDown = async () => {
  const { db, migrator } = getMigrator();
  handleMigration(await migrator.migrateDown());

  await db.destroy();
};

migrateDown();
