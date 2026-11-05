import type { DB } from '@grid-governor/core/db/types';
import type { Kysely } from 'kysely';

import { seasonInputSchema } from '@grid-governor/core/schemas';

import {
    lockSeason,
    requireLeague,
    requireLeaguePermission,
    requireMember,
    requireSeason,
} from '../auth/access.ts';
import { factory } from '../factory.ts';
import { validateBody } from '../middleware/validator.ts';
import { createSeason, getSeason, listSeasons, updateSeason } from './service.ts';

export const leagueSeasonRouter = (db: Kysely<DB>) => {
    const router = factory.createApp();

    router.get('/:leagueId{[0-9]+}/seasons', async (ctx) => {
        const leagueId = ctx.req.param('leagueId');

        const organizationId = await requireLeague(db, leagueId);
        await requireMember(db, ctx.var.user.id, organizationId);

        const seasons = await listSeasons(db, leagueId);

        return ctx.json({ seasons });
    });

    router.post('/:leagueId{[0-9]+}/seasons', validateBody(seasonInputSchema), async (ctx) => {
        const leagueId = ctx.req.param('leagueId');

        const season = await db.transaction().execute(async (tx) => {
            const actor = await requireLeaguePermission({
                db: tx,
                leagueId,
                permissions: { season: ['create'] },
                userId: ctx.var.user.id,
            });

            return createSeason(tx, {
                actor,
                input: ctx.req.valid('json'),
                leagueId,
            });
        });

        return ctx.json(season, 201);
    });

    return router;
};

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

    return router;
};
