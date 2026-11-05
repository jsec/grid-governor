import type { Auth } from '@grid-governor/core/auth';
import type { DB } from '@grid-governor/core/db/types';
import type { Logger } from '@grid-governor/core/logging';
import type { Kysely } from 'kysely';
import type { Resend } from 'resend';

import { except } from 'hono/combine';
import { csrf } from 'hono/csrf';
import { HTTPException } from 'hono/http-exception';
import { requestId } from 'hono/request-id';
import { STATUS_CODES } from 'node:http';
import { z } from 'zod';

import type { ApiConfig } from './config/config.ts';

import { createInviteHandler } from './auth/invite-handler.ts';
import { factory } from './factory.ts';
import { leagueMembershipRouter, membershipRouter } from './league-memberships/router.ts';
import { leagueRouter, organizationLeagueRouter } from './leagues/router.ts';
import { requestLogger } from './middleware/logger.ts';
import { requireSession } from './middleware/session.ts';
import { roundRouter, seasonRoundRouter } from './rounds/router.ts';
import { leagueSeasonRouter, seasonRouter } from './seasons/router.ts';

const constraintViolation = z.object({
    code: z.enum(['23503', '23505']),
});

type AppDependencies = {
    auth: Auth;
    config: Pick<ApiConfig, 'INVITATION_FROM_EMAIL' | 'WEB_URL'>;
    db: Kysely<DB>;
    emails: Pick<Resend['emails'], 'send'>;
    logger: Logger;
};

export const createApp = ({ auth, config, db, emails, logger }: AppDependencies) => {
    const app = factory.createApp();

    const inviteHandler = createInviteHandler({
        authHandler: auth.handler,
        config,
        db,
        emails,
    });

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
    app.on(['GET', 'POST'], '/api/auth/*', ctx => inviteHandler(ctx.req.raw, ctx.var.logger));

    app.route('/api/organizations', organizationLeagueRouter(db));
    app.route('/api/leagues', leagueRouter(db));
    app.route('/api/leagues', leagueSeasonRouter(db));
    app.route('/api/leagues', leagueMembershipRouter(db));
    app.route('/api/league-memberships', membershipRouter(db));
    app.route('/api/seasons', seasonRouter(db));
    app.route('/api/seasons', seasonRoundRouter(db));
    app.route('/api/rounds', roundRouter(db));

    app.notFound(ctx => ctx.json({ error: STATUS_CODES[404] }, 404));

    app.onError((error, ctx) => {
        if (error instanceof HTTPException) {
            return ctx.json({
                error: error.message || STATUS_CODES[error.status],
            }, error.status);
        }

        if (constraintViolation.safeParse(error).success) {
            return ctx.json({ error: STATUS_CODES[409] }, 409);
        }

        ctx.var.logger.error({ err: error }, 'Unhandled error');

        return ctx.json({ error: 'Internal error' }, 500);
    });

    return app;
};
