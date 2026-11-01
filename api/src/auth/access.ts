import type { DB } from '@grid-governor/core/db/types';
import type { Kysely } from 'kysely';

import { leagueRoles, roles } from '@grid-governor/core/access';
import { HTTPException } from 'hono/http-exception';

type LeaguePermissions = Parameters<typeof leagueRoles.manager.authorize>[0];
type Permissions = Parameters<typeof roles.member.authorize>[0];

export const requireMember = async (db: Kysely<DB>, userId: string, organizationId: string) => {
    const member = await db
        .selectFrom('member')
        .select('role')
        .$narrowType<{ role: keyof typeof roles }>()
        .where('organizationId', '=', organizationId)
        .where('userId', '=', userId)
        .executeTakeFirst();

    if (!member) {
        throw new HTTPException(404);
    }

    return member.role;
};

type LeaguePermissionCheck = {
    db: Kysely<DB>;
    leagueId: string;
    permissions: LeaguePermissions;
    userId: string;
};

type PermissionCheck = {
    db: Kysely<DB>;
    organizationId: string;
    permissions: Permissions;
    userId: string;
};

export const requirePermission = async (
    { db, organizationId, permissions, userId }: PermissionCheck,
) => {
    const role = await requireMember(db, userId, organizationId);

    const { success: isAuthorized } = roles[role].authorize(permissions);

    if (!isAuthorized) {
        throw new HTTPException(403);
    }

    return role;
};

export const requireLeaguePermission = async (
    { db, leagueId, permissions, userId }: LeaguePermissionCheck,
) => {
    const organizationId = await requireLeague(db, leagueId);
    const organizationRole = await requireMember(db, userId, organizationId);

    if (organizationRole === 'owner' || organizationRole === 'admin') {
        return { organizationId, role: organizationRole };
    }

    const grants = await db
        .selectFrom('leagueMembership')
        .select('role')
        .$narrowType<{ role: keyof typeof leagueRoles }>()
        .where('leagueId', '=', leagueId)
        .where('userId', '=', userId)
        .where('revokedAt', 'is', null)
        .execute();

    for (const { role } of grants) {
        if (leagueRoles[role].authorize(permissions).success) {
            return { organizationId, role };
        }
    }

    throw new HTTPException(403);
};

export const requireLeague = async (db: Kysely<DB>, leagueId: string) => {
    const league = await db
        .selectFrom('league')
        .select('organizationId')
        .where('leagueId', '=', leagueId)
        .executeTakeFirst();

    if (!league) {
        throw new HTTPException(404);
    }

    return league.organizationId;
};
