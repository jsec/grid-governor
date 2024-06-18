import {
  Result,
  ResultAsync,
  errAsync,
  okAsync
} from 'neverthrow';

import type {
  NewSeason, Season, SeasonUpdate
} from '../../db/types.js';
import type { DeleteStatus } from '../../types/db.js';

import { db } from '../../db/conn.js';
import { AppError, ErrorCode } from '../../types/errors/app.error.js';

export const createSeason = (season: NewSeason): ResultAsync<Season, AppError> => {
  return ResultAsync.fromThrowable(() => db.insertInto('seasons')
    .values(season)
    .returningAll()
    .executeTakeFirstOrThrow(),
  AppError.fromDatabaseError)();
};

type NewType = Season;

export const getSeasonById = (id: number): ResultAsync<NewType, AppError> => {
  return ResultAsync.fromThrowable(() => db
    .selectFrom('seasons')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const updateSeason = (
  id: number,
  season: SeasonUpdate
): ResultAsync<Season, AppError> => {
  return ResultAsync.fromThrowable(() => db.updateTable('seasons')
    .where('id', '=', id)
    .set(season)
    .returningAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const deleteSeason = async (id: number): Promise<Result<DeleteStatus, AppError>> => {
  const result = await db
    .deleteFrom('seasons')
    .where('id', '=', id)
    .executeTakeFirstOrThrow();

  if (Number(result.numDeletedRows) === 0) {
    return errAsync(
      new AppError(
        ErrorCode.NOT_FOUND,
        `Season with id ${id} was not found`,
        'Not Found'
      )
    );
  }

  return okAsync({ status: 'OK' });
};
