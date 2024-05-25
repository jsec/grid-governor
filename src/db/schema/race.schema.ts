import type {
  Generated, Insertable, Selectable, Updateable
} from 'kysely';

import type { DateTime, Timestamp } from './schema.types.js';

export interface RaceSchema {
  createdAt: Timestamp,
  id: Generated<number>,
  leagueId: number,
  name: string,
  seasonId: number,
  time: DateTime,
  updatedAt: Timestamp,
  week: number,
}

export type Race = Selectable<RaceSchema>;
export type NewRace = Insertable<RaceSchema>;
export type RaceUpdate = Updateable<RaceSchema>;
