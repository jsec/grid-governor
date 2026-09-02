import { loadConfig } from '../config/config.js';
import { createDatabase } from './client.js';
import { createMigrator, runMigrations } from './migrate.js';

async function main(): Promise<void> {
    const { databaseUrl } = loadConfig();
    const db = createDatabase(databaseUrl);

    try {
        const migrator = createMigrator(db);
        await runMigrations(migrator);
    } finally {
        await db.destroy();
    }
}

await main();
