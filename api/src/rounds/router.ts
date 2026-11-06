import type { DB } from '@grid-governor/core/db/types';
import type { Kysely } from 'kysely';

import { roundInputSchema } from '@grid-governor/core/schemas';

import { lockRound, requireLeaguePermission } from '../auth/access.ts';
import { factory } from '../factory.ts';
import { validateBody } from '../middleware/validator.ts';
import { deleteLastRound, updateRound } from './service.ts';

export const roundRouter = (db: Kysely<DB>) => {
    const router = factory.createApp();

    router.put('/:roundId{[0-9]+}', validateBody(roundInputSchema), async (ctx) => {
        const roundId = ctx.req.param('roundId');

        const round = await db.transaction().execute(async (tx) => {
            const leagueId = await lockRound(tx, roundId);

            const actor = await requireLeaguePermission({
                db: tx,
                leagueId,
                permissions: { round: ['update'] },
                userId: ctx.var.user.id,
            });

            return updateRound(tx, {
                actor,
                input: ctx.req.valid('json'),
                roundId,
            });
        });

        return ctx.json(round);
    });

    router.delete('/:roundId{[0-9]+}', async (ctx) => {
        const roundId = ctx.req.param('roundId');

        await db.transaction().execute(async (tx) => {
            const leagueId = await lockRound(tx, roundId);

            const actor = await requireLeaguePermission({
                db: tx,
                leagueId,
                permissions: { round: ['update'] },
                userId: ctx.var.user.id,
            });

            await deleteLastRound(tx, { actor, roundId });
        });

        return ctx.body(null, 204);
    });

    return router;
};
