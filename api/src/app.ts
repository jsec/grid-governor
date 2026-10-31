import type { Auth } from '@grid-governor/core/auth';
import type { DB } from '@grid-governor/core/db/types';
import type { Logger } from '@grid-governor/core/logging';
import type { Kysely } from 'kysely';

import { Hono } from 'hono';
import { except } from 'hono/combine';
import { csrf } from 'hono/csrf';
import { HTTPException } from 'hono/http-exception';
import { requestId } from 'hono/request-id';
import { STATUS_CODES } from 'node:http';
import { z } from 'zod';

import type { AuthRouteHandler } from './auth/invite-handler.ts';
import type { ApiConfig } from './config/config.ts';

import { requestLogger } from './middleware/logger.ts';
import { requireSession, type SessionEnv } from './middleware/session.ts';
import { leagueMembershipRouter } from './routers/league-memberships.ts';
import { leagueRouter, organizationLeagueRouter } from './routers/leagues.ts';
import { leagueSeasonRouter } from './routers/seasons.ts';

// TODO: find a better place to put this
const uniqueViolation = z.object({ code: z.literal('23505') });

type AppDependencies = {
    auth: Auth;
    authHandler: AuthRouteHandler;
    config: Pick<ApiConfig, 'WEB_URL'>;
    db: Kysely<DB>;
    logger: Logger;
};

export const createApp = (deps: AppDependencies) => {
    const {
        auth,
        authHandler,
        config,
        db,
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

    app.route('/api/organizations', organizationLeagueRouter(db));
    app.route('/api/leagues', leagueRouter(db));
    app.route('/api/leagues', leagueSeasonRouter(db));
    app.route('/api/league-memberships', leagueMembershipRouter(db));

    app.onError((error, ctx) => {
        if (error instanceof HTTPException) {
            return ctx.json({
                error: STATUS_CODES[error.status],
            }, error.status);
        }

        if (uniqueViolation.safeParse(error).success) {
            return ctx.json({ error: STATUS_CODES[409] }, 409);
        }

        ctx.var.logger.error({ err: error }, 'Unhandled error');

        return ctx.json({ error: 'Internal error' }, 500);
    });

    return app;
};
