import type { DeleteResult } from 'kysely';

import {
  ResultAsync, fromPromise
} from 'neverthrow';

import type {
  NewSeason, Season, SeasonUpdate
} from '../../db/schema/season.schema.js';
import type { DatabaseError } from '../../types/errors/database.errors.js';

import { db } from '../../db/conn.js';
import { isDatabaseError } from '../../types/guards.js';

const handleDatabaseError = (err: unknown) => {
  if (isDatabaseError(err)) {
    return err;
  }

  throw err;
};

export const createSeason = (season: NewSeason): ResultAsync<Season, DatabaseError> => {
  const result = db
    .insertInto('seasons')
    .values(season)
    .returningAll()
    .executeTakeFirstOrThrow();

  return fromPromise(result, handleDatabaseError);
};

export const getSeasonById = (id: number): ResultAsync<Season, DatabaseError> => {
  const result = db
    .selectFrom('seasons')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirstOrThrow();

  return fromPromise(result, handleDatabaseError);
};

export const updateSeason = (
  id: number,
  season: SeasonUpdate
): ResultAsync<Season, DatabaseError> => {
  const result = db
    .updateTable('seasons')
    .where('id', '=', id)
    .set(season)
    .returningAll()
    .executeTakeFirstOrThrow();

  return fromPromise(result, handleDatabaseError);
};

export const deleteSeason = (id: number): ResultAsync<DeleteResult, DatabaseError> => {
  const result = db
    .deleteFrom('seasons')
    .where('id', '=', id)
    .executeTakeFirstOrThrow();

  return fromPromise(result, handleDatabaseError);
};
