import type { DeleteResult } from 'kysely';

import type {
  Driver, DriverUpdate, NewDriver
} from '../../db/schema/driver.schema.js';

import { db } from '../../db/conn.js';

export const createDriver = async (driver: NewDriver): Promise<Driver> => {
  return db
    .insertInto('drivers')
    .values(driver)
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const getDriverById = async (id: number): Promise<Driver> => {
  return db
    .selectFrom('drivers')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirstOrThrow();
};

export const updateDriver = async (id: number, driver: DriverUpdate): Promise<Driver> => {
  return db
    .updateTable('drivers')
    .where('id', '=', id)
    .set(driver)
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const deleteDriver = async (id: number): Promise<DeleteResult> => {
  return db
    .deleteFrom('drivers')
    .where('id', '=', id)
    .clearReturning()
    .executeTakeFirstOrThrow();
};
