import type { DB } from '@grid-governor/core/db/types';
import type { roundInputSchema } from '@grid-governor/core/schemas';
import type { Kysely } from 'kysely';
import type { z } from 'zod';

import { HTTPException } from 'hono/http-exception';

import type { Actor } from '../audit.ts';

import { listChanges, recordAudit } from '../audit.ts';

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

type RoundCreation = {
    actor: Actor;
    input: RoundInput;
    seasonId: string;
};

type RoundDeletion = {
    actor: Actor;
    roundId: string;
};

type RoundInput = z.infer<typeof roundInputSchema>;

type RoundUpdate = {
    actor: Actor;
    input: RoundInput;
    roundId: string;
};

export const listRounds = (db: Kysely<DB>, seasonId: string) => {
    return db
        .selectFrom('round')
        .select(roundColumns)
        .where('round.seasonId', '=', seasonId)
        .orderBy('round.ordinal')
        .execute();
};

export const createRound = async (tx: Kysely<DB>, { actor, input, seasonId }: RoundCreation) => {
    const last = await tx
        .selectFrom('round')
        .select(eb => eb.fn.max('round.ordinal').as('ordinal'))
        .where('round.seasonId', '=', seasonId)
        .executeTakeFirstOrThrow();

    const created = await tx
        .insertInto('round')
        .values({
            ...input,
            ordinal: (last.ordinal ?? 0) + 1,
            seasonId,
        })
        .returning(roundColumns)
        .executeTakeFirstOrThrow();

    await recordAudit(tx, {
        action: 'create',
        actor,
        targetId: created.id,
        targetType: 'round',
    });

    return created;
};

export const updateRound = async (tx: Kysely<DB>, { actor, input, roundId }: RoundUpdate) => {
    const current = await tx
        .selectFrom('round')
        .select(roundColumns)
        .where('round.roundId', '=', roundId)
        .executeTakeFirstOrThrow();

    const changes = listChanges(updatableFields, current, input);

    if (changes.length === 0) {
        return current;
    }

    const updated = await tx
        .updateTable('round')
        .set(input)
        .where('round.roundId', '=', roundId)
        .returning(roundColumns)
        .executeTakeFirstOrThrow();

    await recordAudit(tx, {
        action: 'update',
        actor,
        changes,
        targetId: roundId,
        targetType: 'round',
    });

    return updated;
};

export const deleteLastRound = async (tx: Kysely<DB>, { actor, roundId }: RoundDeletion) => {
    const round = await tx
        .selectFrom('round')
        .select(roundColumns)
        .where('round.roundId', '=', roundId)
        .executeTakeFirstOrThrow();

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
        .where('round.roundId', '=', roundId)
        .execute();

    const changes = deletedFields.map(field => ({
        field,
        from: round[field],
        to: null,
    }));

    await recordAudit(tx, {
        action: 'delete',
        actor,
        changes,
        targetId: roundId,
        targetType: 'round',
    });
};
