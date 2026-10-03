import type { AuthHandler } from '@grid-governor/core/auth';

import { Hono } from 'hono';

export const createApp = (authHandler: AuthHandler) => {
    const app = new Hono();

    app.get('/api/health', ctx => ctx.json({ status: 'ok' }));
    app.on(['GET', 'POST'], '/api/auth/*', ctx => authHandler(ctx.req.raw));

    return app;
};
