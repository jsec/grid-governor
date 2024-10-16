import {
  Result,
  ResultAsync,
  errAsync,
  okAsync
} from 'neverthrow';

import type {
  Incident,
  IncidentUpdate,
  NewIncident
} from '../../db/types.js';
import type { DeleteStatus } from '../../types/db.js';

import { db } from '../../db/conn.js';
import { AppError, ErrorCode } from '../../types/errors/app.error.js';

export const createIncident = (incident: NewIncident): ResultAsync<Incident, AppError> => {
  return ResultAsync.fromThrowable(() => db
    .insertInto('incidents')
    .values(incident)
    .returningAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const getIncidentById = (id: number): ResultAsync<Incident, AppError> => {
  return ResultAsync.fromThrowable(() => db
    .selectFrom('incidents')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const updateIncident = (
  id: number,
  incident: IncidentUpdate
): ResultAsync<Incident, AppError> => {
  return ResultAsync.fromThrowable(() => db
    .updateTable('incidents')
    .where('id', '=', id)
    .set({
      ...incident,
      updatedAt: new Date().toISOString()
    })
    .returningAll()
    .executeTakeFirstOrThrow(), AppError.fromDatabaseError)();
};

export const deleteIncident = async (id: number): Promise<Result<DeleteStatus, AppError>> => {
  const result = await db
    .deleteFrom('incidents')
    .where('id', '=', id)
    .executeTakeFirstOrThrow();

  if (Number(result.numDeletedRows) === 0) {
    return errAsync(
      new AppError(
        ErrorCode.NOT_FOUND,
        `Incident with id ${id} was not found`,
        'Not Found'
      )
    );
  }

  return okAsync({ status: 'OK' });
};
