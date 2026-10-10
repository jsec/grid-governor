import type { Auth, Session } from '@grid-governor/core/auth';

import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

import type { AppEnv } from './logger.ts';

export type SessionEnv = AppEnv & {
    Variables: Session;
};

export const requireSession = (auth: Auth) => createMiddleware<SessionEnv>(async (ctx, next) => {
    const result = await auth.api.getSession({
        headers: ctx.req.raw.headers,
    });

    if (!result) {
        throw new HTTPException(401);
    }

    ctx.set('session', result.session);
    ctx.set('user', result.user);

    await next();
});
