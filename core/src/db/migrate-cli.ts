import { envSchema } from '../config.ts';
import { createDatabase } from './client.ts';
import { migrateToLatest } from './migrate.ts';

const db = createDatabase(envSchema.pick({ DATABASE_URL: true }).parse(process.env).DATABASE_URL);

try {
    await migrateToLatest(db);
} finally {
    await db.destroy();
}
