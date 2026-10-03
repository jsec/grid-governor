import { createAuth } from '@grid-governor/core/auth';
import { loadConfig } from '@grid-governor/core/config/config';
import { createDatabase } from '@grid-governor/core/db/client';
import { serve } from '@hono/node-server';
import { Resend } from 'resend';

import { createApp } from './app.js';
import { createInviteHandler } from './auth/invite-handler.js';
import { createResendInvitationSender } from './auth/send-invitation-email.js';
import { loadApiConfig } from './config/config.js';

const config = loadConfig();
const apiConfig = loadApiConfig();

const db = createDatabase(config.databaseUrl);
const auth = createAuth(db, config);
const resend = new Resend(apiConfig.resendApiKey);
const authHandler = createInviteHandler(
    auth.handler,
    db,
    createResendInvitationSender(apiConfig, resend.emails),
);
const app = createApp(authHandler);

serve({
    fetch: app.fetch,
    port: apiConfig.apiPort,
});
