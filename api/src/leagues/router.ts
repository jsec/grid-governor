import type { DB } from '@grid-governor/core/db/types';
import type { Kysely } from 'kysely';

import {
    grantLeagueRoleSchema,
    seasonInputSchema,
    updateLeagueSchema,
} from '@grid-governor/core/schemas';

import {
    listLeagueRoles,
    lockLeague,
    requireLeague,
    requireLeaguePermission,
    requireMember,
    requirePermission,
} from '../auth/access.ts';
import { factory } from '../factory.ts';
import { grantLeagueRole, listLeagueMemberships } from '../league-memberships/service.ts';
import { validateBody } from '../middleware/validator.ts';
import { createSeason, listSeasons } from '../seasons/service.ts';
import { getLeague, updateLeague } from './service.ts';

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

    router.get('/:leagueId{[0-9]+}/memberships', async (ctx) => {
        const leagueId = ctx.req.param('leagueId');

        const organizationId = await requireLeague(db, leagueId);
        await requireMember(db, ctx.var.user.id, organizationId);

        const memberships = await listLeagueMemberships(db, leagueId, organizationId);

        return ctx.json({ memberships });
    });

    router.post(
        '/:leagueId{[0-9]+}/memberships',
        validateBody(grantLeagueRoleSchema),
        async (ctx) => {
            const leagueId = ctx.req.param('leagueId');

            const membership = await db.transaction().execute(async (tx) => {
                const organizationId = await requireLeague(tx, leagueId);

                const actor = await requirePermission({
                    db: tx,
                    organizationId,
                    permissions: { leagueRole: ['grant'] },
                    userId: ctx.var.user.id,
                });

                return grantLeagueRole(tx, {
                    actor: { ...actor, leagueId },
                    input: ctx.req.valid('json'),
                });
            });

            return ctx.json(membership, 201);
        },
    );

    router.get('/:leagueId{[0-9]+}/roles', async (ctx) => {
        const leagueId = ctx.req.param('leagueId');
        const userId = ctx.var.user.id;

        const organizationId = await requireLeague(db, leagueId);
        const organizationRole = await requireMember(db, userId, organizationId);

        const leagueRoles = await listLeagueRoles(db, leagueId, userId);

        return ctx.json({ leagueRoles, organizationRole });
    });

    return router;
};
