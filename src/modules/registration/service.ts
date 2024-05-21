import type { DeleteResult } from 'kysely';

import {
  Result, ResultAsync, errAsync,
  okAsync
} from 'neverthrow';

import type {
  NewRegistration, Registration, RegistrationUpdate
} from '../../db/schema/registration.schema.js';

import { db } from '../../db/conn.js';
import { AppError, ErrorCode } from '../../types/errors/app.error.js';

export const createRegistration = (
  registration: NewRegistration
): ResultAsync<Registration, AppError> => {
  return ResultAsync.fromThrowable(() => db.insertInto('registrations').values(registration)
    .returningAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const getRegistrationById = (id: number): ResultAsync<Registration, AppError> => {
  return ResultAsync.fromThrowable(() => db
    .selectFrom('registrations')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const updateRegistration = (
  id: number,
  registration: RegistrationUpdate
): ResultAsync<Registration, AppError> => {
  return ResultAsync.fromThrowable(() => db.updateTable('registrations')
    .where('id', '=', id)
    .set(registration)
    .returningAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const deleteRegistration = async (id: number): Promise<Result<DeleteResult, AppError>> => {
  const result = await db
    .deleteFrom('registrations')
    .where('id', '=', id)
    .executeTakeFirstOrThrow();

  if (Number(result.numDeletedRows) === 0) {
    return errAsync(
      new AppError(
        ErrorCode.NOT_FOUND,
        `Registration with id ${id} was not found`,
        'Not Found'
      )
    );
  }

  return okAsync(result);
};
