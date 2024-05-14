import type {
  Generated, Insertable, Selectable, Updateable
} from 'kysely';

import type { Timestamp } from './schema.types.js';

export interface PenaltySchema {
  createdAt: Timestamp,
  description: string,
  id: Generated<number>,
  name: string,
  updatedAt: Timestamp,
}

export type Penalty = Selectable<PenaltySchema>;
export type NewPenalty = Insertable<PenaltySchema>;
export type PenaltyUpdate = Updateable<PenaltySchema>;
