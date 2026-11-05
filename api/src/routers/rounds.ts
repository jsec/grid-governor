import type { DB } from '@grid-governor/core/db/types';
import type { Kysely } from 'kysely';

import { roundInputSchema } from '@grid-governor/core/schemas';
import { HTTPException } from 'hono/http-exception';
import { isDeepStrictEqual } from 'node:util';

import { requireLeague, requireLeaguePermission, requireMember } from '../auth/access.ts';
import { factory } from '../factory.ts';
import { validateBody } from '../middleware/validator.ts';

const roundColumns = [
    'round.createdAt',
    'round.ordinal',
    'round.roundId as id',
    'round.seasonId',
    'round.startsAt',
    'round.track',
] as const;

const updatableFields = ['startsAt', 'track'] as const;
const deletedFields = ['ordinal', 'startsAt', 'track'] as const;

export const seasonRoundRouter = (db: Kysely<DB>) => {
    const router = factory.createApp();

    router.get('/:seasonId{[0-9]+}/rounds', async (ctx) => {
        const seasonId = ctx.req.param('seasonId');

        const season = await db
            .selectFrom('season')
            .select('season.leagueId')
            .where('season.seasonId', '=', seasonId)
            .executeTakeFirst();

        if (!season) {
            throw new HTTPException(404);
        }

        const organizationId = await requireLeague(db, season.leagueId);
        await requireMember(db, ctx.var.user.id, organizationId);

        const rounds = await db
            .selectFrom('round')
            .select(roundColumns)
            .where('round.seasonId', '=', seasonId)
            .orderBy('round.ordinal')
            .execute();

        return ctx.json({ rounds });
    });

    router.post('/:seasonId{[0-9]+}/rounds', validateBody(roundInputSchema), async (ctx) => {
        const seasonId = ctx.req.param('seasonId');
        const userId = ctx.var.user.id;

        const round = await db.transaction().execute(async (tx) => {
            const season = await tx
                .selectFrom('season')
                .select('season.leagueId')
                .where('season.seasonId', '=', seasonId)
                .forUpdate()
                .executeTakeFirst();

            if (!season) {
                throw new HTTPException(404);
            }

            const { organizationId, role } = await requireLeaguePermission({
                db: tx,
                leagueId: season.leagueId,
                permissions: { round: ['create'] },
                userId,
            });

            const last = await tx
                .selectFrom('round')
                .select(eb => eb.fn.max('round.ordinal').as('ordinal'))
                .where('round.seasonId', '=', seasonId)
                .executeTakeFirstOrThrow();

            const created = await tx
                .insertInto('round')
                .values({
                    ...ctx.req.valid('json'),
                    ordinal: (last.ordinal ?? 0) + 1,
                    seasonId,
                })
                .returning(roundColumns)
                .executeTakeFirstOrThrow();

            await tx
                .insertInto('auditEntry')
                .values({
                    action: 'create',
                    actorRole: role,
                    actorUserId: userId,
                    leagueId: season.leagueId,
                    organizationId,
                    targetId: created.id,
                    targetType: 'round',
                })
                .execute();

            return created;
        });

        return ctx.json(round, 201);
    });

    return router;
};

export const roundRouter = (db: Kysely<DB>) => {
    const router = factory.createApp();

    router.put('/:roundId{[0-9]+}', validateBody(roundInputSchema), async (ctx) => {
        const body = ctx.req.valid('json');
        const userId = ctx.var.user.id;

        const round = await db.transaction().execute(async (tx) => {
            const existing = await tx
                .selectFrom('round')
                .innerJoin('season', 'season.seasonId', 'round.seasonId')
                .select([
                    ...roundColumns,
                    'season.leagueId',
                ])
                .where('round.roundId', '=', ctx.req.param('roundId'))
                .forUpdate()
                .executeTakeFirst();

            if (!existing) {
                throw new HTTPException(404);
            }

            const { leagueId, ...current } = existing;

            const { organizationId, role } = await requireLeaguePermission({
                db: tx,
                leagueId,
                permissions: { round: ['update'] },
                userId,
            });

            const changes = [];

            for (const field of updatableFields) {
                if (!isDeepStrictEqual(body[field], current[field])) {
                    changes.push({
                        field,
                        from: current[field],
                        to: body[field],
                    });
                }
            }

            if (changes.length === 0) {
                return current;
            }

            const updated = await tx
                .updateTable('round')
                .set(body)
                .where('round.roundId', '=', current.id)
                .returning(roundColumns)
                .executeTakeFirstOrThrow();

            await tx
                .insertInto('auditEntry')
                .values({
                    action: 'update',
                    actorRole: role,
                    actorUserId: userId,
                    changes: JSON.stringify(changes),
                    leagueId,
                    organizationId,
                    targetId: current.id,
                    targetType: 'round',
                })
                .execute();

            return updated;
        });

        return ctx.json(round);
    });

    router.delete('/:roundId{[0-9]+}', async (ctx) => {
        const userId = ctx.var.user.id;

        await db.transaction().execute(async (tx) => {
            const round = await tx
                .selectFrom('round')
                .innerJoin('season', 'season.seasonId', 'round.seasonId')
                .select([
                    ...roundColumns,
                    'season.leagueId',
                ])
                .where('round.roundId', '=', ctx.req.param('roundId'))
                .forUpdate()
                .executeTakeFirst();

            if (!round) {
                throw new HTTPException(404);
            }

            const { organizationId, role } = await requireLeaguePermission({
                db: tx,
                leagueId: round.leagueId,
                permissions: { round: ['update'] },
                userId,
            });

            const last = await tx
                .selectFrom('round')
                .select(eb => eb.fn.max('round.ordinal').as('ordinal'))
                .where('round.seasonId', '=', round.seasonId)
                .executeTakeFirstOrThrow();

            if (round.ordinal !== last.ordinal) {
                throw new HTTPException(409);
            }

            await tx
                .deleteFrom('round')
                .where('round.roundId', '=', round.id)
                .execute();

            const changes = deletedFields.map(field => ({
                field,
                from: round[field],
                to: null,
            }));

            await tx
                .insertInto('auditEntry')
                .values({
                    action: 'delete',
                    actorRole: role,
                    actorUserId: userId,
                    changes: JSON.stringify(changes),
                    leagueId: round.leagueId,
                    organizationId,
                    targetId: round.id,
                    targetType: 'round',
                })
                .execute();
        });

        return ctx.body(null, 204);
    });

    return router;
};
