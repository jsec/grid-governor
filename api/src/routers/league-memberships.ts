import type { DB } from '@grid-governor/core/db/types';
import type { Kysely } from 'kysely';

import { HTTPException } from 'hono/http-exception';

import { requirePermission } from '../auth/access.ts';
import { factory } from '../factory.ts';

export const leagueMembershipRouter = (db: Kysely<DB>) => {
    const router = factory.createApp();

    router.delete('/:membershipId{[0-9]+}', async (ctx) => {
        const userId = ctx.var.user.id;

        const membership = await db
            .selectFrom('leagueMembership')
            .innerJoin('league', 'league.leagueId', 'leagueMembership.leagueId')
            .select([
                'league.organizationId',
                'leagueMembership.leagueId',
                'leagueMembership.membershipId',
            ])
            .where('leagueMembership.membershipId', '=', ctx.req.param('membershipId'))
            .where('leagueMembership.revokedAt', 'is', null)
            .executeTakeFirst();

        if (!membership) {
            throw new HTTPException(404);
        }

        const actorRole = await requirePermission({
            db,
            organizationId: membership.organizationId,
            permissions: { leagueRole: ['revoke'] },
            userId,
        });

        await db.transaction().execute(async (tx) => {
            await tx
                .updateTable('leagueMembership')
                .set({
                    revokedAt: new Date(),
                })
                .where('membershipId', '=', membership.membershipId)
                .execute();

            await tx
                .insertInto('auditEntry')
                .values({
                    action: 'revoke',
                    actorRole,
                    actorUserId: userId,
                    leagueId: membership.leagueId,
                    organizationId: membership.organizationId,
                    targetId: membership.membershipId,
                    targetType: 'league_membership',
                })
                .execute();
        });

        return ctx.body(null, 204);
    });

    return router;
};
