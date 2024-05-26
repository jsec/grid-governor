import type { DeleteResult } from 'kysely';

import {
  Result, ResultAsync, errAsync, okAsync
} from 'neverthrow';

import type {
  NewRace, Race, RaceUpdate
} from '../../db/schema/race.schema.js';

import { db } from '../../db/conn.js';
import { AppError, ErrorCode } from '../../types/errors/app.error.js';

export const createRace = (race: NewRace): ResultAsync<Race, AppError> => {
  return ResultAsync.fromThrowable(() => db
    .insertInto('races')
    .values(race)
    .returningAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const getRaceById = (id: number): ResultAsync<Race, AppError> => {
  return ResultAsync.fromThrowable(() => db
    .selectFrom('races')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const updateRace = (id: number, race: RaceUpdate): ResultAsync<Race, AppError> => {
  return ResultAsync.fromThrowable(() => db
    .updateTable('races')
    .where('id', '=', id)
    .set(race)
    .returningAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const deleteRace = async (id: number): Promise<Result<DeleteResult, AppError>> => {
  const result = await db
    .deleteFrom('races')
    .where('id', '=', id)
    .executeTakeFirstOrThrow();

  if (Number(result.numDeletedRows) === 0) {
    return errAsync(
      new AppError(
        ErrorCode.NOT_FOUND,
        `Race with id ${id} was not found`,
        'Not Found'
      )
    );
  }

  return okAsync(result);
};