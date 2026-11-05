import type { DB } from '@grid-governor/core/db/types';
import type { Kysely } from 'kysely';

import { grantLeagueRoleSchema } from '@grid-governor/core/schemas';

import {
    listLeagueRoles,
    lockMembership,
    requireLeague,
    requireMember,
    requirePermission,
} from '../auth/access.ts';
import { factory } from '../factory.ts';
import { validateBody } from '../middleware/validator.ts';
import { grantLeagueRole, listLeagueMemberships, revokeLeagueRole } from './service.ts';

export const leagueMembershipRouter = (db: Kysely<DB>) => {
    const router = factory.createApp();

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

export const membershipRouter = (db: Kysely<DB>) => {
    const router = factory.createApp();

    router.delete('/:membershipId{[0-9]+}', async (ctx) => {
        const membershipId = ctx.req.param('membershipId');

        await db.transaction().execute(async (tx) => {
            const membership = await lockMembership(tx, membershipId);

            const actor = await requirePermission({
                db: tx,
                organizationId: membership.organizationId,
                permissions: { leagueRole: ['revoke'] },
                userId: ctx.var.user.id,
            });

            await revokeLeagueRole(tx, {
                actor: { ...actor, leagueId: membership.leagueId },
                membershipId,
            });
        });

        return ctx.body(null, 204);
    });

    return router;
};
