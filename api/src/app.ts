import type { Auth } from '@grid-governor/core/auth';
import type { Logger } from '@grid-governor/core/logging';

import { Hono } from 'hono';
import { except } from 'hono/combine';
import { csrf } from 'hono/csrf';
import { HTTPException } from 'hono/http-exception';
import { requestId } from 'hono/request-id';

import type { AuthRouteHandler } from './auth/invite-handler.ts';
import type { ApiConfig } from './config/config.ts';

import { requestLogger } from './middleware/logger.ts';
import { requireSession, type SessionEnv } from './middleware/session.ts';

type AppDependencies = {
    auth: Auth;
    authHandler: AuthRouteHandler;
    config: Pick<ApiConfig, 'WEB_URL'>;
    logger: Logger;
};

export const createApp = (deps: AppDependencies) => {
    const {
        auth,
        authHandler,
        config,
        logger,
    } = deps;

    const app = new Hono<SessionEnv>();

    app.use('/api/*',
        requestId(),
        requestLogger(logger),
        except(
            ['/api/auth/*', '/api/health'],
            csrf({ origin: config.WEB_URL }),
            requireSession(auth),
        ),
    );

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
