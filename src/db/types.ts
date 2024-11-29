import type {
  Insertable,
  Selectable,
  Updateable,
} from 'kysely';

import type {
  DriverTable,
  IncidentTable,
  LeagueTable,
  PenaltyTable,
  PlatformTable,
  RaceTable,
  RegistrationTable,
  RulingTable,
  SeasonTable,
} from './schema.js';

export type Driver = Selectable<DriverTable>;
export type NewDriver = Insertable<DriverTable>;
export type DriverUpdate = Updateable<DriverTable>;

export type Incident = Selectable<IncidentTable>;
export type NewIncident = Insertable<IncidentTable>;
export type IncidentUpdate = Updateable<IncidentTable>;

export type League = Selectable<LeagueTable>;
export type NewLeague = Insertable<LeagueTable>;
export type LeagueUpdate = Updateable<LeagueTable>;

export type Penalty = Selectable<PenaltyTable>;
export type NewPenalty = Insertable<PenaltyTable>;
export type PenaltyUpdate = Updateable<PenaltyTable>;

export type Platform = Selectable<PlatformTable>;
export type NewPlatform = Insertable<PlatformTable>;
export type PlatformUpdate = Updateable<PlatformTable>;

export type Race = Selectable<RaceTable>;
export type NewRace = Insertable<RaceTable>;
export type RaceUpdate = Updateable<RaceTable>;

export type Registration = Selectable<RegistrationTable>;
export type NewRegistration = Insertable<RegistrationTable>;
export type RegistrationUpdate = Updateable<RegistrationTable>;

export type Ruling = Selectable<RulingTable>;
export type NewRuling = Insertable<RulingTable>;
export type RulingUpdate = Updateable<RulingTable>;

export type Season = Selectable<SeasonTable>;
export type NewSeason = Insertable<SeasonTable>;
export type SeasonUpdate = Updateable<SeasonTable>;
