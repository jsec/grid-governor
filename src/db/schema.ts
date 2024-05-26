import type { ColumnType, Generated } from 'kysely';

type Timestamp = ColumnType<Date, string | undefined, never>;

type DateTime = ColumnType<Date, string, string>;

export interface DriverTable {
  createdAt: Timestamp,
  discordId: string,
  firstName: string,
  id: Generated<number>,
  lastName: string,
  steamId: string,
  updatedAt: Timestamp,
}

export interface IncidentTable {
  createdAt: Timestamp,
  description: string,
  driverId: number,
  id: Generated<number>,
  lapNumber: number,
  raceId: number,
  reportingDriverId: number,
  updatedAt: Timestamp,
}

export interface LeagueTable {
  createdAt: Timestamp,
  description: string,
  id: Generated<number>,
  name: string,
  updatedAt: Timestamp,
}

export interface PenaltyTable {
  createdAt: Timestamp,
  description: string,
  id: Generated<number>,
  name: string,
  updatedAt: Timestamp,
}

export interface PlatformTable {
  createdAt: Timestamp,
  id: Generated<number>,
  name: string,
  updatedAt: Timestamp,
}

export interface RaceTable {
  createdAt: Timestamp,
  id: Generated<number>,
  leagueId: number,
  name: string,
  seasonId: number,
  time: DateTime,
  updatedAt: Timestamp,
  week: number,
}

export interface RegistrationTable {
  createdAt: Timestamp,
  driverId: number,
  id: Generated<number>,
  seasonId: number,
  updatedAt: Timestamp,
}

export interface RulingTable {
  createdAt: Timestamp,
  id: Generated<number>,
  incidentId: number,
  penaltyId: number,
  updatedAt: Timestamp,
}

export interface SeasonTable {
  createdAt: Timestamp,
  description: string,
  endDate: DateTime,
  id: Generated<number>,
  leagueId: number,
  name: string,
  platformId: number,
  startDate: DateTime,
  updatedAt: Timestamp,
}

export interface Database {
  drivers: DriverTable,
  incidents: IncidentTable,
  leagues: LeagueTable,
  penalties: PenaltyTable,
  platforms: PlatformTable,
  races: RaceTable,
  registrations: RegistrationTable,
  rulings: RulingTable,
  seasons: SeasonTable,
}
