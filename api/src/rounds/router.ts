import type { DB } from '@grid-governor/core/db/types';
import type { Kysely } from 'kysely';

import { roundInputSchema } from '@grid-governor/core/schemas';

import {
    lockRound,
    lockSeason,
    requireLeague,
    requireLeaguePermission,
    requireMember,
    requireSeason,
} from '../auth/access.ts';
import { factory } from '../factory.ts';
import { validateBody } from '../middleware/validator.ts';
import { createRound, deleteLastRound, listRounds, updateRound } from './service.ts';

export const seasonRoundRouter = (db: Kysely<DB>) => {
    const router = factory.createApp();

    router.get('/:seasonId{[0-9]+}/rounds', async (ctx) => {
        const seasonId = ctx.req.param('seasonId');

        const leagueId = await requireSeason(db, seasonId);
        const organizationId = await requireLeague(db, leagueId);
        await requireMember(db, ctx.var.user.id, organizationId);

        const rounds = await listRounds(db, seasonId);

        return ctx.json({ rounds });
    });

    router.post('/:seasonId{[0-9]+}/rounds', validateBody(roundInputSchema), async (ctx) => {
        const seasonId = ctx.req.param('seasonId');

        const round = await db.transaction().execute(async (tx) => {
            const leagueId = await lockSeason(tx, seasonId);

            const actor = await requireLeaguePermission({
                db: tx,
                leagueId,
                permissions: { round: ['create'] },
                userId: ctx.var.user.id,
            });

            return createRound(tx, {
                actor,
                input: ctx.req.valid('json'),
                seasonId,
            });
        });

        return ctx.json(round, 201);
    });

    return router;
};

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
