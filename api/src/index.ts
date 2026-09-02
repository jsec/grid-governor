import { serve } from '@hono/node-server';

import { createApp } from './app.js';
import { createAuth } from './auth.js';
import { loadConfig } from './config/config.js';
import { createDatabase } from './db/client.js';

const {
    apiPort,
    betterAuthSecret,
    betterAuthUrl,
    databaseUrl,
} = loadConfig();

const db = createDatabase(databaseUrl);
const auth = createAuth(db, betterAuthUrl, betterAuthSecret);
const app = createApp(auth.handler);

serve({
    fetch: app.fetch,
    port: apiPort,
});
