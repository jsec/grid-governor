import type { DB } from '@grid-governor/core/db/types';
import type { createLeagueSchema, updateLeagueSchema } from '@grid-governor/core/schemas';
import type { Kysely } from 'kysely';
import type { z } from 'zod';

import type { Actor, OrganizationActor } from '../audit.ts';

import { listChanges, recordAudit } from '../audit.ts';

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

type LeagueCreation = {
    actor: OrganizationActor;
    input: z.infer<typeof createLeagueSchema>;
};

type LeagueUpdate = {
    actor: Actor;
    input: z.infer<typeof updateLeagueSchema>;
};

export const listLeagues = (db: Kysely<DB>, organizationId: string) => {
    return db
        .selectFrom('league')
        .select(leagueColumns)
        .where('organizationId', '=', organizationId)
        .orderBy('name')
        .execute();
};

export const getLeague = (db: Kysely<DB>, leagueId: string) => {
    return db
        .selectFrom('league')
        .select(leagueColumns)
        .where('leagueId', '=', leagueId)
        .executeTakeFirstOrThrow();
};

export const createLeague = async (tx: Kysely<DB>, { actor, input }: LeagueCreation) => {
    const created = await tx
        .insertInto('league')
        .values({
            ...input,
            organizationId: actor.organizationId,
        })
        .returning(leagueColumns)
        .executeTakeFirstOrThrow();

    await recordAudit(tx, {
        action: 'create',
        actor: { ...actor, leagueId: created.id },
        targetId: created.id,
        targetType: 'league',
    });

    return created;
};

export const updateLeague = async (tx: Kysely<DB>, { actor, input }: LeagueUpdate) => {
    const current = await getLeague(tx, actor.leagueId);

    const changes = listChanges(updatableFields, current, input);

    if (changes.length === 0) {
        return current;
    }

    const updated = await tx
        .updateTable('league')
        .set(input)
        .where('leagueId', '=', actor.leagueId)
        .returning(leagueColumns)
        .executeTakeFirstOrThrow();

    await recordAudit(tx, {
        action: 'update',
        actor,
        changes,
        targetId: actor.leagueId,
        targetType: 'league',
    });

    return updated;
};
