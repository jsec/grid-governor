import type { DB } from '@grid-governor/core/db/types';
import type { Platform, seasonInputSchema } from '@grid-governor/core/schemas';
import type { ExpressionBuilder, Kysely } from 'kysely';
import type { z } from 'zod';

import { HTTPException } from 'hono/http-exception';

import type { Actor } from '../audit.ts';

import { listChanges, recordAudit } from '../audit.ts';

const seasonColumns = [
    'season.createdAt',
    'season.dropWorst',
    'season.expiryRounds',
    'season.fastestLapBonus',
    'season.leagueId',
    'season.name',
    'season.platform',
    'season.pointsScheme',
    'season.poleBonus',
    'season.seasonId as id',
] as const;

const updatableFields = [
    'dropWorst',
    'expiryRounds',
    'fastestLapBonus',
    'name',
    'platform',
    'pointsScheme',
    'poleBonus',
] as const;

type SeasonCreation = {
    actor: Actor;
    input: SeasonInput;
    leagueId: string;
};

type SeasonInput = z.infer<typeof seasonInputSchema>;

type SeasonUpdate = {
    actor: Actor;
    input: SeasonInput;
    seasonId: string;
};

const hasResults = (eb: ExpressionBuilder<DB, 'season'>) => {
    return eb.exists(
        eb.selectFrom('result')
            .select('result.seasonId')
            .whereRef('result.seasonId', '=', 'season.seasonId'))
        .as('hasResults');
};

export const listSeasons = (db: Kysely<DB>, leagueId: string) => {
    return db
        .selectFrom('season')
        .select([
            ...seasonColumns,
            hasResults,
        ])
        .where('season.leagueId', '=', leagueId)
        .orderBy('season.seasonId', 'desc')
        .execute();
};

export const getSeason = (db: Kysely<DB>, seasonId: string) => {
    return db
        .selectFrom('season')
        .select([
            ...seasonColumns,
            hasResults,
        ])
        .where('season.seasonId', '=', seasonId)
        .$narrowType<{ platform: Platform }>()
        .executeTakeFirstOrThrow();
};

export const createSeason = async (tx: Kysely<DB>, { actor, input, leagueId }: SeasonCreation) => {
    const created = await tx
        .insertInto('season')
        .values({
            ...input,
            leagueId,
        })
        .returning(seasonColumns)
        .executeTakeFirstOrThrow();

    await recordAudit(tx, {
        action: 'create',
        actor,
        targetId: created.id,
        targetType: 'season',
    });

    return {
        ...created,
        hasResults: false,
    };
};

export const updateSeason = async (tx: Kysely<DB>, { actor, input, seasonId }: SeasonUpdate) => {
    const current = await getSeason(tx, seasonId);

    const changes = listChanges(updatableFields, current, input);
    const isScoringChange = changes.some(change => change.field !== 'name');

    if (isScoringChange && current.hasResults) {
        throw new HTTPException(409);
    }

    if (changes.length === 0) {
        return current;
    }

    const updated = await tx
        .updateTable('season')
        .set(input)
        .where('season.seasonId', '=', seasonId)
        .returning(seasonColumns)
        .executeTakeFirstOrThrow();

    await recordAudit(tx, {
        action: 'update',
        actor,
        changes,
        targetId: seasonId,
        targetType: 'season',
    });

    return {
        ...updated,
        hasResults: current.hasResults,
    };
};
