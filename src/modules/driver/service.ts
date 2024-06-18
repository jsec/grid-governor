import {
  Result, ResultAsync, errAsync, okAsync
} from 'neverthrow';

import type {
  Driver, DriverUpdate, NewDriver
} from '../../db/types.js';
import type { DeleteStatus } from '../../types/db.js';

import { db } from '../../db/conn.js';
import { AppError, ErrorCode } from '../../types/errors/app.error.js';

export const createDriver = (driver: NewDriver): ResultAsync<Driver, AppError> => {
  return ResultAsync.fromThrowable(() => db
    .insertInto('drivers')
    .values(driver)
    .returningAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const getDriverById = (id: number): ResultAsync<Driver, AppError> => {
  return ResultAsync.fromThrowable(() => db
    .selectFrom('drivers')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const updateDriver = (id: number, driver: DriverUpdate): ResultAsync<Driver, AppError> => {
  return ResultAsync.fromThrowable(() => db
    .updateTable('drivers')
    .where('id', '=', id)
    .set(driver)
    .returningAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const deleteDriver = async (id: number): Promise<Result<DeleteStatus, AppError>> => {
  const result = await db
    .deleteFrom('drivers')
    .where('id', '=', id)
    .clearReturning()
    .executeTakeFirstOrThrow();

  if (Number(result.numDeletedRows) === 0) {
    return errAsync(
      new AppError(
        ErrorCode.NOT_FOUND,
        `Driver with id ${id} was not found`,
        'Not Found'
      )
    );
  }

  return okAsync({ status: 'OK' });
};
