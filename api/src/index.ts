import { serve } from '@hono/node-server';
import { Resend } from 'resend';

import { createApp } from './app.js';
import { createAuth } from './auth.js';
import { createInviteHandler } from './auth/invite-handler.js';
import { createResendInvitationSender } from './auth/send-invitation-email.js';
import { loadConfig } from './config/config.js';
import { createDatabase } from './db/client.js';

const config = loadConfig();

const db = createDatabase(config.databaseUrl);
const auth = createAuth(db, config);
const resend = new Resend(config.resendApiKey);
const authHandler = createInviteHandler(
    auth.handler,
    db,
    createResendInvitationSender(config, resend.emails),
);
const app = createApp(authHandler);

serve({
    fetch: app.fetch,
    port: config.apiPort,
});
