import type { DeleteResult } from 'kysely';

import {
  Result, ResultAsync, errAsync, okAsync
} from 'neverthrow';

import type { NewRuling, RulingUpdate } from '../../db/types.js';
import type { Ruling } from './types.js';

import { db } from '../../db/conn.js';
import { AppError, ErrorCode } from '../../types/errors/app.error.js';

export const createRuling = (ruling: NewRuling): ResultAsync<Ruling, AppError> => {
  return ResultAsync.fromThrowable(() => db
    .insertInto('rulings')
    .values(ruling)
    .returningAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const getRulingById = (id: number): ResultAsync<Ruling, AppError> => {
  return ResultAsync.fromThrowable(() => db
    .selectFrom('rulings')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const updateRuling = (id: number, ruling: RulingUpdate): ResultAsync<Ruling, AppError> => {
  return ResultAsync.fromThrowable(() => db
    .updateTable('rulings')
    .where('id', '=', id)
    .set(ruling)
    .returningAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const deleteRuling = async (id: number): Promise<Result<DeleteResult, AppError>> => {
  const result = await db
    .deleteFrom('rulings')
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