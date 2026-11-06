import type { DB } from '@grid-governor/core/db/types';
import type { Kysely } from 'kysely';

import { lockMembership, requirePermission } from '../auth/access.ts';
import { factory } from '../factory.ts';
import { revokeLeagueRole } from './service.ts';

export const leagueMembershipRouter = (db: Kysely<DB>) => {
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
