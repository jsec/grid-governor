import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable
} from 'kysely';

export type Timestamp = ColumnType<Date, string | undefined, never>;

export interface LeagueSchema {
  createdAt: Timestamp,
  description: string,
  id: Generated<number>,
  name: string,
  updatedAt: Timestamp,
}

export type League = Selectable<LeagueSchema>;
export type NewLeague = Insertable<LeagueSchema>;
export type LeagueUpdate = Updateable<LeagueSchema>;
