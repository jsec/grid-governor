import { createAuth } from '@grid-governor/core/auth';
import { loadConfig } from '@grid-governor/core/config';
import { createDatabase } from '@grid-governor/core/db/client';
import { createLogger } from '@grid-governor/core/logging';
import { serve } from '@hono/node-server';
import { Resend } from 'resend';

import { createApp } from './app.ts';
import { loadApiConfig } from './config/config.ts';

const config = loadConfig();

const logger = createLogger({
    config,
    destination: process.stdout,
    service: 'api',
});

const apiConfig = loadApiConfig();
const db = createDatabase(config.DATABASE_URL);
const auth = createAuth(db, config);
const resend = new Resend(apiConfig.RESEND_API_KEY);

const app = createApp({
    auth,
    config: apiConfig,
    db,
    emails: resend.emails,
    logger,
});

serve({
    fetch: app.fetch,
    port: apiConfig.API_PORT,
});
