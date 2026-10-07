import type { AuthHandler } from '@grid-governor/core/auth';
import type { Logger } from '@grid-governor/core/logging';

import { Hono } from 'hono';
import { requestId } from 'hono/request-id';

import { type AppEnv, requestLogger } from './middleware/logger.ts';

export const createApp = (authHandler: AuthHandler, logger: Logger) => {
    const app = new Hono<AppEnv>();

    app.use('/api/*', requestId(), requestLogger(logger));
    app.get('/api/health', ctx => ctx.json({ status: 'ok' }));
    app.on(['GET', 'POST'], '/api/auth/*', ctx => authHandler(ctx.req.raw));

    return app;
};
