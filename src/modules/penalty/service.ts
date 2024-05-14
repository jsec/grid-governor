import type { DeleteResult } from 'kysely';

import type {
  NewPenalty, Penalty, PenaltyUpdate
} from '../../db/schema/penalty.schema.js';

import { db } from '../../db/conn.js';

export const createPenalty = async (penalty: NewPenalty): Promise<Penalty> => {
  return db
    .insertInto('penalties')
    .values(penalty)
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const getPenaltyById = async (id: number): Promise<Penalty> => {
  return db
    .selectFrom('penalties')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirstOrThrow();
};

export const updatePenalty = async (id: number, penalty: PenaltyUpdate): Promise<Penalty> => {
  return db
    .updateTable('penalties')
    .where('id', '=', id)
    .set(penalty)
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const deletePenalty = async (id: number): Promise<DeleteResult> => {
  return db
    .deleteFrom('penalties')
    .where('id', '=', id)
    .clearReturning()
    .executeTakeFirstOrThrow();
};
