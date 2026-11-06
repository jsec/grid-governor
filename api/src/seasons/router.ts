import type { DB } from '@grid-governor/core/db/types';
import type { Kysely } from 'kysely';

import { roundInputSchema, seasonInputSchema } from '@grid-governor/core/schemas';

import {
    lockSeason,
    requireLeague,
    requireLeaguePermission,
    requireMember,
    requireSeason,
} from '../auth/access.ts';
import { factory } from '../factory.ts';
import { validateBody } from '../middleware/validator.ts';
import { createRound, listRounds } from '../rounds/service.ts';
import { getSeason, updateSeason } from './service.ts';

export const seasonRouter = (db: Kysely<DB>) => {
    const router = factory.createApp();

    router.get('/:seasonId{[0-9]+}', async (ctx) => {
        const seasonId = ctx.req.param('seasonId');

        const leagueId = await requireSeason(db, seasonId);
        const organizationId = await requireLeague(db, leagueId);
        await requireMember(db, ctx.var.user.id, organizationId);

        const season = await getSeason(db, seasonId);

        return ctx.json(season);
    });

    router.put('/:seasonId{[0-9]+}', validateBody(seasonInputSchema), async (ctx) => {
        const seasonId = ctx.req.param('seasonId');

        const season = await db.transaction().execute(async (tx) => {
            const leagueId = await lockSeason(tx, seasonId);

            const actor = await requireLeaguePermission({
                db: tx,
                leagueId,
                permissions: { season: ['update'] },
                userId: ctx.var.user.id,
            });

            return updateSeason(tx, {
                actor,
                input: ctx.req.valid('json'),
                seasonId,
            });
        });

        return ctx.json(season);
    });

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
