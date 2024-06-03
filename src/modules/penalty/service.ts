import type { DeleteResult } from 'kysely';

import {
  Result, ResultAsync, errAsync, okAsync
} from 'neverthrow';

import type {
  NewPenalty, Penalty, PenaltyUpdate
} from '../../db/types.js';

import { db } from '../../db/conn.js';
import { AppError, ErrorCode } from '../../types/errors/app.error.js';

export const createPenalty = (penalty: NewPenalty): ResultAsync<Penalty, AppError> => {
  return ResultAsync.fromThrowable(() => db
    .insertInto('penalties')
    .values(penalty)
    .returningAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const getPenaltyById = (id: number): ResultAsync<Penalty, AppError> => {
  return ResultAsync.fromThrowable(() => db
    .selectFrom('penalties')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const updatePenalty = (
  id: number, penalty: PenaltyUpdate
): ResultAsync<Penalty, AppError> => {
  return ResultAsync.fromThrowable(() => db
    .updateTable('penalties')
    .where('id', '=', id)
    .set(penalty)
    .returningAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const deletePenalty = async (id: number): Promise<Result<DeleteResult, AppError>> => {
  const result = await db
    .deleteFrom('penalties')
    .where('id', '=', id)
    .clearReturning()
    .executeTakeFirstOrThrow();

  if (Number(result.numDeletedRows) === 0) {
    return errAsync(
      new AppError(
        ErrorCode.NOT_FOUND,
        `Penalty with id ${id} was not found`,
        'Not Found'
      )
    );
  }

  return okAsync(result);
};
