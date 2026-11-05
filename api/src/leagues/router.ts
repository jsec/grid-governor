import type { DB } from '@grid-governor/core/db/types';
import type { Kysely } from 'kysely';

import { createLeagueSchema, updateLeagueSchema } from '@grid-governor/core/schemas';

import { lockLeague, requireLeague, requireMember, requirePermission } from '../auth/access.ts';
import { factory } from '../factory.ts';
import { validateBody } from '../middleware/validator.ts';
import { createLeague, getLeague, listLeagues, updateLeague } from './service.ts';

export const organizationLeagueRouter = (db: Kysely<DB>) => {
    const router = factory.createApp();

    router.get('/:organizationId/leagues', async (ctx) => {
        const organizationId = ctx.req.param('organizationId');

        await requireMember(db, ctx.var.user.id, organizationId);

        const leagues = await listLeagues(db, organizationId);

        return ctx.json({ leagues });
    });

    router.post('/:organizationId/leagues', validateBody(createLeagueSchema), async (ctx) => {
        const league = await db.transaction().execute(async (tx) => {
            const actor = await requirePermission({
                db: tx,
                organizationId: ctx.req.param('organizationId'),
                permissions: { league: ['create'] },
                userId: ctx.var.user.id,
            });

            return createLeague(tx, {
                actor,
                input: ctx.req.valid('json'),
            });
        });

        return ctx.json(league, 201);
    });

    return router;
};

export const leagueRouter = (db: Kysely<DB>) => {
    const router = factory.createApp();

    router.get('/:leagueId{[0-9]+}', async (ctx) => {
        const leagueId = ctx.req.param('leagueId');

        const organizationId = await requireLeague(db, leagueId);
        await requireMember(db, ctx.var.user.id, organizationId);

        const league = await getLeague(db, leagueId);

        return ctx.json(league);
    });

    router.put('/:leagueId{[0-9]+}', validateBody(updateLeagueSchema), async (ctx) => {
        const leagueId = ctx.req.param('leagueId');

        const league = await db.transaction().execute(async (tx) => {
            const organizationId = await lockLeague(tx, leagueId);

            const actor = await requirePermission({
                db: tx,
                organizationId,
                permissions: { league: ['update'] },
                userId: ctx.var.user.id,
            });

            return updateLeague(tx, {
                actor: { ...actor, leagueId },
                input: ctx.req.valid('json'),
            });
        });

        return ctx.json(league);
    });

    return router;
};
