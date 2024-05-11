import type {
  Generated, Insertable, Selectable, Updateable
} from 'kysely';

export interface LeagueSchema {
  createdAt: Generated<Date>,
  description: string,
  id: Generated<number>,
  name: string,
  updatedAt: Generated<Date>,
}

export type League = Selectable<LeagueSchema>;
export type NewLeague = Insertable<LeagueSchema>;
export type LeagueUpdate = Updateable<LeagueSchema>;
