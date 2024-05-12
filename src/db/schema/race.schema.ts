import type {
  Generated, Insertable, Selectable, Updateable
} from 'kysely';

export interface RaceSchema {
  createdAt: Generated<Date>,
  id: Generated<number>,
  leagueId: number,
  name: string,
  seasonId: number,
  time: Date,
  updatedAt: Generated<Date>,
  week: number,
}

export type Race = Selectable<RaceSchema>;
export type NewRace = Insertable<RaceSchema>;
export type RaceUpdate = Updateable<RaceSchema>;
