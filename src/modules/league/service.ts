import type { DeleteResult } from 'kysely';

import {
  Result, ResultAsync, errAsync, okAsync
} from 'neverthrow';

import type {
  League, LeagueUpdate, NewLeague
} from '../../db/types.js';
import type { DeleteStatus } from '../../types/db.js';

import { db } from '../../db/conn.js';
import { AppError, ErrorCode } from '../../types/errors/app.error.js';

export const createLeague = (league: NewLeague): ResultAsync<League, AppError> => {
  return ResultAsync.fromThrowable(() => db
    .insertInto('leagues')
    .values(league)
    .returningAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const getLeagueById = (id: number): ResultAsync<League, AppError> => {
  return ResultAsync.fromThrowable(() => db
    .selectFrom('leagues')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const updateLeague = (id: number, league: LeagueUpdate): ResultAsync<League, AppError> => {
  return ResultAsync.fromThrowable(() => db
    .updateTable('leagues')
    .where('id', '=', id)
    .set(league)
    .returningAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const deleteLeague = async (id: number): Promise<Result<DeleteStatus, AppError>> => {
  const result = await db
    .deleteFrom('leagues')
    .where('id', '=', id)
    .clearReturning()
    .executeTakeFirstOrThrow();

  if (Number(result.numDeletedRows) === 0) {
    return errAsync(
      new AppError(
        ErrorCode.NOT_FOUND,
        `League with id ${id} was not found`,
        'Not Found'
      )
    );
  }

  return okAsync({ status: 'OK' });
};
