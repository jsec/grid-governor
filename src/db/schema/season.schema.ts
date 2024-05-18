import type {
  Generated, Insertable, Selectable, Updateable
} from 'kysely';

import type { Timestamp } from './schema.types.js';

export interface SeasonSchema {
  createdAt: Timestamp,
  description: string,
  endDate: Date | null,
  id: Generated<number>,
  leagueId: number,
  name: string,
  platformId: number,
  startDate: Date,
  updatedAt: Timestamp,
}

export type Season = Selectable<SeasonSchema>;
export type NewSeason = Insertable<SeasonSchema>;
export type SeasonUpdate = Updateable<SeasonSchema>;
