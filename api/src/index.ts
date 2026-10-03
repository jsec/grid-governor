import { createAuth } from '@grid-governor/core/auth';
import { loadConfig } from '@grid-governor/core/config/config';
import { createDatabase } from '@grid-governor/core/db/client';
import { serve } from '@hono/node-server';
import { Resend } from 'resend';

import { createApp } from './app.ts';
import { createInviteHandler } from './auth/invite-handler.ts';
import { loadApiConfig } from './config/config.ts';

const config = loadConfig();
const apiConfig = loadApiConfig();

const db = createDatabase(config.DATABASE_URL);
const auth = createAuth(db, config);
const resend = new Resend(apiConfig.RESEND_API_KEY);
const app = createApp(createInviteHandler(auth.handler, db, resend.emails, apiConfig));

serve({
    fetch: app.fetch,
    port: apiConfig.API_PORT,
});
