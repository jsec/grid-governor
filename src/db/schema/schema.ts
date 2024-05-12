import type { DriverSchema } from './driver.schema.js';
import type { IncidentSchema } from './incident.schema.js';
import type { LeagueSchema } from './league.schema.js';
import type { PenaltySchema } from './penalty.schema.js';
import type { PlatformSchema } from './platform.schema.js';
import type { RaceSchema } from './race.schema.js';
import type { RegistrationSchema } from './registration.schema.js';
import type { RulingSchema } from './ruling.schema.js';
import type { SeasonSchema } from './season.schema.js';

export interface Database {
  drivers: DriverSchema,
  incidents: IncidentSchema,
  leagues: LeagueSchema,
  penalties: PenaltySchema,
  platforms: PlatformSchema,
  races: RaceSchema,
  registrations: RegistrationSchema,
  rulings: RulingSchema,
  seasons: SeasonSchema,
}
