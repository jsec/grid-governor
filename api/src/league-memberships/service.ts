import type { DB } from '@grid-governor/core/db/types';
import type { grantLeagueRoleSchema } from '@grid-governor/core/schemas';
import type { Kysely } from 'kysely';
import type { z } from 'zod';

import { HTTPException } from 'hono/http-exception';

import type { Actor } from '../audit.ts';

import { recordAudit } from '../audit.ts';

const leagueMembershipColumns = [
    'leagueMembership.grantedAt',
    'leagueMembership.membershipId as id',
    'leagueMembership.role',
    'leagueMembership.userId',
] as const;

type RoleGrant = {
    actor: Actor;
    input: z.infer<typeof grantLeagueRoleSchema>;
};

type RoleRevocation = {
    actor: Actor;
    membershipId: string;
};

export const listLeagueMemberships = (db: Kysely<DB>, leagueId: string, organizationId: string) => {
    return db
        .selectFrom('leagueMembership')
        .innerJoin('member', 'member.userId', 'leagueMembership.userId')
        .select(leagueMembershipColumns)
        .where('leagueMembership.leagueId', '=', leagueId)
        .where('leagueMembership.revokedAt', 'is', null)
        .where('member.organizationId', '=', organizationId)
        .orderBy('leagueMembership.grantedAt')
        .execute();
};

export const grantLeagueRole = async (tx: Kysely<DB>, { actor, input }: RoleGrant) => {
    const grantee = await tx
        .selectFrom('member')
        .select('role')
        .where('organizationId', '=', actor.organizationId)
        .where('userId', '=', input.userId)
        .executeTakeFirst();

    if (grantee?.role !== 'member') {
        throw new HTTPException(400, {
            message: 'Only organization members can hold league roles',
        });
    }

    const created = await tx
        .insertInto('leagueMembership')
        .values({
            ...input,
            grantedBy: actor.userId,
            leagueId: actor.leagueId,
        })
        .returning(leagueMembershipColumns)
        .executeTakeFirstOrThrow();

    await recordAudit(tx, {
        action: 'grant',
        actor,
        targetId: created.id,
        targetType: 'league_membership',
    });

    return created;
};

export const revokeLeagueRole = async (tx: Kysely<DB>, { actor, membershipId }: RoleRevocation) => {
    await tx
        .updateTable('leagueMembership')
        .set({ revokedAt: new Date() })
        .where('membershipId', '=', membershipId)
        .execute();

    await recordAudit(tx, {
        action: 'revoke',
        actor,
        targetId: membershipId,
        targetType: 'league_membership',
    });
};
