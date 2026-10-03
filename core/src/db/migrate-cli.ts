import { envSchema } from '../config/config.js';
import { createDatabase } from './client.js';
import { migrateToLatest } from './migrate.js';

const db = createDatabase(envSchema.pick({ DATABASE_URL: true }).parse(process.env).DATABASE_URL);

try {
    await migrateToLatest(db);
} finally {
    await db.destroy();
}
