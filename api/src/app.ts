import { Hono } from 'hono';

import type { AuthHandler } from './auth.js';

export const createApp = (authHandler?: AuthHandler) => {
    const app = new Hono();

    app.get('/api/health', context => context.json({ status: 'ok' }));

    if (authHandler) {
        app.on(['GET', 'POST'], '/api/auth/*', context =>
            authHandler(context.req.raw),
        );
    }

    return app;
};

export const app = createApp();
