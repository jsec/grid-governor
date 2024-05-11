import { DeleteResult } from 'kysely';

import type {
  NewPlatform, Platform, PlatformUpdate
} from '../db/schema/platform.schema.js';

import { db } from '../db/conn.js';

export const createPlatform = async (platform: NewPlatform): Promise<Platform> => {
  return db
    .insertInto('platforms')
    .values(platform)
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const getPlatformById = async (id: number): Promise<Platform> => {
  return db
    .selectFrom('platforms')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirstOrThrow();
};

export const updatePlatform = async (id: number, league: PlatformUpdate): Promise<Platform> => {
  return db
    .updateTable('platforms')
    .where('id', '=', id)
    .set(league)
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const deletePlatform = async (id: number): Promise<DeleteResult> => {
  return db
    .deleteFrom('platforms')
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
};
