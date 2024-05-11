import type {
  Generated, Insertable, Selectable, Updateable
} from 'kysely';

export interface PenaltySchema {
  createdAt: Generated<Date>,
  description: string,
  id: Generated<number>,
  name: string,
  updatedAt: Generated<Date>,
}

export type Penalty = Selectable<PenaltySchema>;
export type NewPenalty = Insertable<PenaltySchema>;
export type PenaltyUpdate = Updateable<PenaltySchema>;
