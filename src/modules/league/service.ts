import type { DeleteResult } from 'kysely';

import type {
  League, LeagueUpdate, NewLeague
} from '../../db/schema/league.schema.js';

import { db } from '../../db/conn.js';

export const createLeague = async (league: NewLeague): Promise<League> => {
  return db
    .insertInto('leagues')
    .values(league)
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const getLeagueById = async (id: number): Promise<League> => {
  return db
    .selectFrom('leagues')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirstOrThrow();
};

export const updateLeague = async (id: number, league: LeagueUpdate): Promise<League> => {
  return db
    .updateTable('leagues')
    .where('id', '=', id)
    .set(league)
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const deleteLeague = async (id: number): Promise<DeleteResult> => {
  return db
    .deleteFrom('leagues')
    .where('id', '=', id)
    .clearReturning()
    .executeTakeFirstOrThrow();
};
