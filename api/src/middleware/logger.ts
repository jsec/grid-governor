import type { Logger } from '@grid-governor/core/logging';
import type { RequestIdVariables } from 'hono/request-id';

import { createMiddleware } from 'hono/factory';
import { routePath } from 'hono/route';

export type AppEnv = {
    Variables: RequestIdVariables & { logger: Logger };
};

export const requestLogger = (logger: Logger) => createMiddleware<AppEnv>(async (ctx, next) => {
    if (ctx.req.path === '/api/health') {
        return next();
    }

    const httpLogger = logger.child({
        request_id: ctx.get('requestId'),
    });

    ctx.set('logger', httpLogger);
    const start = performance.now();

    await next();

    httpLogger.info({
        duration_ms: Math.round(performance.now() - start),
        method: ctx.req.method,
        route: routePath(ctx, -1),
        status: ctx.res.status,
    }, 'request completed');
});
