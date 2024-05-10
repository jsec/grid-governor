import type {
  Generated, Insertable, Selectable, Updateable
} from 'kysely';

export interface LeagueSchema {
  created_at: Generated<Date>,
  description: string,
  id: Generated<number>,
  name: string,
  updated_at: Generated<Date>,
}

export type League = Selectable<LeagueSchema>;
export type NewLeague = Insertable<LeagueSchema>;
export type LeagueUpdate = Updateable<LeagueSchema>;
