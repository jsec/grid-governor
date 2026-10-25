import type { DB } from '@grid-governor/core/db/types';
import type { Kysely } from 'kysely';

import {
    createLeagueSchema,
    grantLeagueRoleSchema,
    updateLeagueSchema,
} from '@grid-governor/core/schemas';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { SessionEnv } from '../middleware/session.ts';

import { requireMember, requirePermission } from '../auth/access.ts';
import { validateBody } from '../middleware/validator.ts';

const leagueColumns = [
    'banLengthRounds',
    'createdAt',
    'leagueId as id',
    'name',
    'organizationId',
    'rulingSlaHours',
    'suspensionThresholdPoints',
] as const;

const updatableFields = [
    'banLengthRounds',
    'name',
    'rulingSlaHours',
    'suspensionThresholdPoints',
] as const;

const leagueMembershipColumns = [
    'leagueMembership.grantedAt',
    'leagueMembership.membershipId as id',
    'leagueMembership.role',
    'leagueMembership.userId',
] as const;

export const organizationLeagueRouter = (db: Kysely<DB>) => {
    const router = new Hono<SessionEnv>();

    router.get('/:organizationId/leagues', async (ctx) => {
        const organizationId = ctx.req.param('organizationId');

        await requireMember(db, ctx.var.user.id, organizationId);

        const leagues = await db
            .selectFrom('league')
            .select(leagueColumns)
            .where('organizationId', '=', organizationId)
            .orderBy('name')
            .execute();

        return ctx.json({ leagues });
    });

    router.post('/:organizationId/leagues', validateBody(createLeagueSchema), async (ctx) => {
        const organizationId = ctx.req.param('organizationId');
        const userId = ctx.var.user.id;

        const role = await requirePermission(db, userId, organizationId, {
            league: ['create'],
        });

        const league = await db.transaction().execute(async (tx) => {
            const created = await tx
                .insertInto('league')
                .values({
                    ...ctx.req.valid('json'),
                    organizationId,
                })
                .returning(leagueColumns)
                .executeTakeFirstOrThrow();

            await tx
                .insertInto('auditEntry')
                .values({
                    action: 'create',
                    actorRole: role,
                    actorUserId: userId,
                    leagueId: created.id,
                    organizationId,
                    targetId: created.id,
                    targetType: 'league',
                })
                .execute();

            return created;
        });

        return ctx.json(league, 201);
    });

    return router;
};

export const leagueRouter = (db: Kysely<DB>) => {
    const router = new Hono<SessionEnv>();

    router.get('/:leagueId{[0-9]+}', async (ctx) => {
        const league = await db
            .selectFrom('league')
            .select(leagueColumns)
            .where('leagueId', '=', ctx.req.param('leagueId'))
            .executeTakeFirst();

        if (!league) {
            throw new HTTPException(404);
        }

        await requireMember(db, ctx.var.user.id, league.organizationId);

        return ctx.json(league);
    });

    router.put('/:leagueId{[0-9]+}', validateBody(updateLeagueSchema), async (ctx) => {
        const body = ctx.req.valid('json');
        const userId = ctx.var.user.id;

        const league = await db.transaction().execute(async (tx) => {
            const existing = await tx
                .selectFrom('league')
                .select(leagueColumns)
                .where('leagueId', '=', ctx.req.param('leagueId'))
                .forUpdate()
                .executeTakeFirst();

            if (!existing) {
                throw new HTTPException(404);
            }

            const role = await requirePermission(tx, userId, existing.organizationId, {
                league: ['update'],
            });

            const changes = [];

            for (const field of updatableFields) {
                if (body[field] !== existing[field]) {
                    changes.push({
                        field,
                        from: existing[field],
                        to: body[field],
                    });
                }
            }

            if (changes.length === 0) {
                return existing;
            }

            const updated = await tx
                .updateTable('league')
                .set(body)
                .where('leagueId', '=', existing.id)
                .returning(leagueColumns)
                .executeTakeFirstOrThrow();

            await tx
                .insertInto('auditEntry')
                .values({
                    action: 'update',
                    actorRole: role,
                    actorUserId: userId,
                    changes: JSON.stringify(changes),
                    leagueId: existing.id,
                    organizationId: existing.organizationId,
                    targetId: existing.id,
                    targetType: 'league',
                })
                .execute();

            return updated;
        });

        return ctx.json(league);
    });

    router.get('/:leagueId{[0-9]+}/memberships', async (ctx) => {
        const leagueId = ctx.req.param('leagueId');

        const league = await db
            .selectFrom('league')
            .select('organizationId')
            .where('leagueId', '=', leagueId)
            .executeTakeFirst();

        if (!league) {
            throw new HTTPException(404);
        }

        await requireMember(db, ctx.var.user.id, league.organizationId);

        const memberships = await db
            .selectFrom('leagueMembership')
            .innerJoin('member', 'member.userId', 'leagueMembership.userId')
            .select(leagueMembershipColumns)
            .where('leagueMembership.leagueId', '=', leagueId)
            .where('leagueMembership.revokedAt', 'is', null)
            .where('member.organizationId', '=', league.organizationId)
            .orderBy('leagueMembership.grantedAt')
            .execute();

        return ctx.json({ memberships });
    });

    router.post(
        '/:leagueId{[0-9]+}/memberships',
        validateBody(grantLeagueRoleSchema),
        async (ctx) => {
            const leagueId = ctx.req.param('leagueId');
            const body = ctx.req.valid('json');
            const userId = ctx.var.user.id;

            const league = await db
                .selectFrom('league')
                .select('organizationId')
                .where('leagueId', '=', leagueId)
                .executeTakeFirst();

            if (!league) {
                throw new HTTPException(404);
            }

            const actorRole = await requirePermission(db, userId, league.organizationId, {
                leagueRole: ['grant'],
            });

            const grantee = await db
                .selectFrom('member')
                .select('role')
                .where('organizationId', '=', league.organizationId)
                .where('userId', '=', body.userId)
                .executeTakeFirst();

            if (grantee?.role !== 'member') {
                return ctx.json({
                    error: 'Only organization members can hold league roles',
                }, 400);
            }

            const membership = await db.transaction().execute(async (tx) => {
                const created = await tx
                    .insertInto('leagueMembership')
                    .values({
                        ...body,
                        grantedBy: userId,
                        leagueId,
                    })
                    .returning(leagueMembershipColumns)
                    .executeTakeFirstOrThrow();

                await tx
                    .insertInto('auditEntry')
                    .values({
                        action: 'grant',
                        actorRole,
                        actorUserId: userId,
                        leagueId,
                        organizationId: league.organizationId,
                        targetId: created.id,
                        targetType: 'league_membership',
                    })
                    .execute();

                return created;
            });

            return ctx.json(membership, 201);
        });

    return router;
};
