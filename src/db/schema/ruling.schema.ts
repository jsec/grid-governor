import type {
  Generated, Insertable, Selectable, Updateable
} from 'kysely';

export interface RulingSchema {
  createdAt: Generated<Date>,
  id: Generated<number>,
  incidentId: number,
  penaltyId: number,
  updatedAt: Generated<Date>,
}

export type Ruling = Selectable<RulingSchema>;
export type NewRuling = Insertable<RulingSchema>;
export type RulingUpdate = Updateable<RulingSchema>;
