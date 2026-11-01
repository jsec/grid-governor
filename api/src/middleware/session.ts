import type { Auth, Session } from '@grid-governor/core/auth';

import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

import type { AppEnv } from './logger.ts';

export type SessionEnv = AppEnv & {
    Variables: Session;
};

export const requireSession = (auth: Auth) => createMiddleware<SessionEnv>(async (ctx, next) => {
    const session = await auth.api.getSession({
        headers: ctx.req.raw.headers,
    });

    if (!session) {
        throw new HTTPException(401);
    }

    ctx.set('session', session.session);
    ctx.set('user', session.user);

    await next();
});
