import type {
  Generated,
  Insertable,
  Selectable,
  Updateable
} from 'kysely';

import type { Timestamp } from './schema.types.js';

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
