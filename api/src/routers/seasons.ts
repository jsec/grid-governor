import type { DB } from '@grid-governor/core/db/types';
import type { ExpressionBuilder, Kysely } from 'kysely';

import { seasonInputSchema } from '@grid-governor/core/schemas';
import { Hono } from 'hono';

import type { SessionEnv } from '../middleware/session.ts';

import { requireLeague, requireLeaguePermission, requireMember } from '../auth/access.ts';
import { validateBody } from '../middleware/validator.ts';

const seasonColumns = [
    'season.createdAt',
    'season.dropWorst',
    'season.expiryRounds',
    'season.fastestLapBonus',
    'season.leagueId',
    'season.name',
    'season.pointsScheme',
    'season.poleBonus',
    'season.seasonId as id',
] as const;

const hasResults = (eb: ExpressionBuilder<DB, 'season'>) => {
    return eb.exists(
        eb.selectFrom('result')
            .select('result.seasonId')
            .whereRef('result.seasonId', '=', 'season.seasonId'))
        .as('hasResults');
};

export const leagueSeasonRouter = (db: Kysely<DB>) => {
    const router = new Hono<SessionEnv>();

    router.get('/:leagueId{[0-9]+}/seasons', async (ctx) => {
        const leagueId = ctx.req.param('leagueId');

        const organizationId = await requireLeague(db, leagueId);
        await requireMember(db, ctx.var.user.id, organizationId);

        const seasons = await db
            .selectFrom('season')
            .select([
                ...seasonColumns,
                hasResults,
            ])
            .where('season.leagueId', '=', leagueId)
            .orderBy('season.seasonId', 'desc')
            .execute();

        return ctx.json({ seasons });
    });

    router.post('/:leagueId{[0-9]+}/seasons', validateBody(seasonInputSchema), async (ctx) => {
        const leagueId = ctx.req.param('leagueId');
        const userId = ctx.var.user.id;

        const { organizationId, role } = await requireLeaguePermission(db, userId, leagueId, {
            season: ['create'],
        });

        const season = await db.transaction().execute(async (tx) => {
            const created = await tx
                .insertInto('season')
                .values({
                    ...ctx.req.valid('json'),
                    leagueId,
                })
                .returning(seasonColumns)
                .executeTakeFirstOrThrow();

            await tx
                .insertInto('auditEntry')
                .values({
                    action: 'create',
                    actorRole: role,
                    actorUserId: userId,
                    leagueId,
                    organizationId,
                    targetId: created.id,
                    targetType: 'season',
                })
                .execute();

            return created;
        });

        return ctx.json({ ...season, hasResults: false }, 201);
    });

    return router;
};
