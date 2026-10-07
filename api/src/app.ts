import type { Logger } from '@grid-governor/core/logging';

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requestId } from 'hono/request-id';

import type { AuthRouteHandler } from './auth/invite-handler.ts';

import { type AppEnv, requestLogger } from './middleware/logger.ts';

export const createApp = (authHandler: AuthRouteHandler, logger: Logger) => {
    const app = new Hono<AppEnv>();

    app.use('/api/*', requestId(), requestLogger(logger));
    app.get('/api/health', ctx => ctx.json({ status: 'ok' }));
    app.on(['GET', 'POST'], '/api/auth/*', ctx => authHandler(ctx.req.raw, ctx.var.logger));

    app.onError((error, ctx) => {
        if (error instanceof HTTPException) {
            return error.getResponse();
        }

        ctx.var.logger.error({ err: error }, 'Unhandled error');

        return ctx.json({ error: 'Internal error' }, 500);
    });

    return app;
};
