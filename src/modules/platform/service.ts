import {
  Result,
  ResultAsync,
  errAsync,
  okAsync
} from 'neverthrow';

import type {
  NewPlatform,
  Platform,
  PlatformUpdate
} from '../../db/types.js';
import type { DeleteStatus } from '../../types/db.js';

import { db } from '../../db/conn.js';
import { AppError, ErrorCode } from '../../types/errors/app.error.js';

export const createPlatform = (platform: NewPlatform): ResultAsync<Platform, AppError> => {
  return ResultAsync.fromThrowable(() => db
    .insertInto('platforms')
    .values(platform)
    .returningAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const getPlatformById = (id: number): ResultAsync<Platform, AppError> => {
  return ResultAsync.fromThrowable(() => db
    .selectFrom('platforms')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const updatePlatform = (
  id: number, platform: PlatformUpdate
): ResultAsync<Platform, AppError> => {
  return ResultAsync.fromThrowable(() => db
    .updateTable('platforms')
    .where('id', '=', id)
    .set({
      ...platform,
      updatedAt: new Date().toISOString()
    })
    .returningAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const deletePlatform = async (id: number): Promise<Result<DeleteStatus, AppError>> => {
  const result = await db
    .deleteFrom('platforms')
    .where('id', '=', id)
    .executeTakeFirstOrThrow();

  if (Number(result.numDeletedRows) === 0) {
    return errAsync(
      new AppError(
        ErrorCode.NOT_FOUND,
        `Platform with id ${id} was not found`,
        'Not Found'
      )
    );
  }

  return okAsync({ status: 'OK' });
};
