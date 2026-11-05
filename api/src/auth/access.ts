import type { DB } from '@grid-governor/core/db/types';
import type { Kysely } from 'kysely';

import { leagueRoles, roles } from '@grid-governor/core/access';
import { HTTPException } from 'hono/http-exception';

import type { Actor, OrganizationActor } from '../audit.ts';

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
): Promise<OrganizationActor> => {
    const role = await requireMember(db, userId, organizationId);

    const { success: isAuthorized } = roles[role].authorize(permissions);

    if (!isAuthorized) {
        throw new HTTPException(403);
    }

    return {
        organizationId,
        role,
        userId,
    };
};

export const requireLeaguePermission = async (
    { db, leagueId, permissions, userId }: LeaguePermissionCheck,
): Promise<Actor> => {
    const organizationId = await requireLeague(db, leagueId);
    const organizationRole = await requireMember(db, userId, organizationId);

    if (organizationRole === 'owner' || organizationRole === 'admin') {
        return {
            leagueId,
            organizationId,
            role: organizationRole,
            userId,
        };
    }

    const roles = await listLeagueRoles(db, leagueId, userId);

    for (const role of roles) {
        if (leagueRoles[role].authorize(permissions).success) {
            return {
                leagueId,
                organizationId,
                role,
                userId,
            };
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

export const listLeagueRoles = async (db: Kysely<DB>, leagueId: string, userId: string) => {
    const grants = await db
        .selectFrom('leagueMembership')
        .select('role')
        .$narrowType<{ role: keyof typeof leagueRoles }>()
        .where('leagueId', '=', leagueId)
        .where('userId', '=', userId)
        .where('revokedAt', 'is', null)
        .execute();

    return grants.map(grant => grant.role);
};

export const requireSeason = async (db: Kysely<DB>, seasonId: string) => {
    const season = await db
        .selectFrom('season')
        .select('leagueId')
        .where('seasonId', '=', seasonId)
        .executeTakeFirst();

    if (!season) {
        throw new HTTPException(404);
    }

    return season.leagueId;
};

export const lockSeason = async (tx: Kysely<DB>, seasonId: string) => {
    const season = await tx
        .selectFrom('season')
        .select('leagueId')
        .where('seasonId', '=', seasonId)
        .forUpdate()
        .executeTakeFirst();

    if (!season) {
        throw new HTTPException(404);
    }

    return season.leagueId;
};

export const lockRound = async (tx: Kysely<DB>, roundId: string) => {
    const round = await tx
        .selectFrom('round')
        .innerJoin('season', 'season.seasonId', 'round.seasonId')
        .select('season.leagueId')
        .where('round.roundId', '=', roundId)
        .forUpdate()
        .executeTakeFirst();

    if (!round) {
        throw new HTTPException(404);
    }

    return round.leagueId;
};

export const lockLeague = async (tx: Kysely<DB>, leagueId: string) => {
    const league = await tx
        .selectFrom('league')
        .select('organizationId')
        .where('leagueId', '=', leagueId)
        .forUpdate()
        .executeTakeFirst();

    if (!league) {
        throw new HTTPException(404);
    }

    return league.organizationId;
};

export const lockMembership = async (tx: Kysely<DB>, membershipId: string) => {
    const membership = await tx
        .selectFrom('leagueMembership')
        .innerJoin('league', 'league.leagueId', 'leagueMembership.leagueId')
        .select(['league.organizationId', 'leagueMembership.leagueId'])
        .where('leagueMembership.membershipId', '=', membershipId)
        .where('leagueMembership.revokedAt', 'is', null)
        .forUpdate()
        .executeTakeFirst();

    if (!membership) {
        throw new HTTPException(404);
    }

    return membership;
};
