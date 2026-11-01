import type { DB } from '@grid-governor/core/db/types';
import type { ExpressionBuilder, Kysely } from 'kysely';

import { seasonInputSchema } from '@grid-governor/core/schemas';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { isDeepStrictEqual } from 'node:util';

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

const updatableFields = [
    'dropWorst',
    'expiryRounds',
    'fastestLapBonus',
    'name',
    'pointsScheme',
    'poleBonus',
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

        const { organizationId, role } = await requireLeaguePermission({
            db,
            leagueId,
            permissions: { season: ['create'] },
            userId,
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

export const seasonRouter = (db: Kysely<DB>) => {
    const router = new Hono<SessionEnv>();

    router.get('/:seasonId{[0-9]+}', async (ctx) => {
        const season = await db
            .selectFrom('season')
            .select([
                ...seasonColumns,
                hasResults,
            ])
            .where('season.seasonId', '=', ctx.req.param('seasonId'))
            .executeTakeFirst();

        if (!season) {
            throw new HTTPException(404);
        }

        const organizationId = await requireLeague(db, season.leagueId);
        await requireMember(db, ctx.var.user.id, organizationId);

        return ctx.json(season);
    });

    router.put('/:seasonId{[0-9]+}', validateBody(seasonInputSchema), async (ctx) => {
        const body = ctx.req.valid('json');
        const userId = ctx.var.user.id;

        const season = await db.transaction().execute(async (tx) => {
            const existing = await tx
                .selectFrom('season')
                .select([
                    ...seasonColumns,
                    hasResults,
                ])
                .where('season.seasonId', '=', ctx.req.param('seasonId'))
                .forUpdate()
                .executeTakeFirst();

            if (!existing) {
                throw new HTTPException(404);
            }

            const { organizationId, role } = await requireLeaguePermission({
                db: tx,
                leagueId: existing.leagueId,
                permissions: { season: ['update'] },
                userId,
            });

            const changes = [];

            for (const field of updatableFields) {
                if (!isDeepStrictEqual(body[field], existing[field])) {
                    changes.push({
                        field,
                        from: existing[field],
                        to: body[field],
                    });
                }
            }

            if (existing.hasResults && changes.some(change => change.field !== 'name')) {
                throw new HTTPException(409);
            }

            if (changes.length === 0) {
                return existing;
            }

            const updated = await tx
                .updateTable('season')
                .set(body)
                .where('season.seasonId', '=', existing.id)
                .returning(seasonColumns)
                .executeTakeFirstOrThrow();

            await tx
                .insertInto('auditEntry')
                .values({
                    action: 'update',
                    actorRole: role,
                    actorUserId: userId,
                    changes: JSON.stringify(changes),
                    leagueId: existing.leagueId,
                    organizationId,
                    targetId: existing.id,
                    targetType: 'season',
                })
                .execute();

            return {
                ...updated,
                hasResults: existing.hasResults,
            };
        });

        return ctx.json(season);
    });

    return router;
};
