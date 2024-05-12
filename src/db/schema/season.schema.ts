import type {
  Generated, Insertable, Selectable, Updateable
} from 'kysely';

export interface SeasonSchema {
  createdAt: Generated<Date>,
  description: string,
  endDate: Date | null,
  id: Generated<number>,
  leagueId: number,
  name: string,
  platformId: number,
  startDate: Date,
  updatedAt: Generated<Date>,
}

export type Season = Selectable<SeasonSchema>;
export type NewSeason = Insertable<SeasonSchema>;
export type SeasonUpdate = Updateable<SeasonSchema>;
