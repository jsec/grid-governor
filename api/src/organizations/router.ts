import type { DB } from '@grid-governor/core/db/types';
import type { Kysely } from 'kysely';

import { createLeagueSchema } from '@grid-governor/core/schemas';

import { requireMember, requirePermission } from '../auth/access.ts';
import { factory } from '../factory.ts';
import { createLeague, listLeagues } from '../leagues/service.ts';
import { validateBody } from '../middleware/validator.ts';

export const organizationRouter = (db: Kysely<DB>) => {
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
