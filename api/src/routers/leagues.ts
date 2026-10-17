import type { DB } from '@grid-governor/core/db/types';
import type { Kysely } from 'kysely';

import { createLeagueSchema } from '@grid-governor/core/schemas';
import { Hono } from 'hono';

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
