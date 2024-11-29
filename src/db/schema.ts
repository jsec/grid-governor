import type { ColumnType, Generated } from 'kysely';

type CreateTimestamp = ColumnType<Date, string | undefined, never>;
type UpdateTimestamp = ColumnType<Date, string | undefined, Date | string>;

type DateTime = ColumnType<Date, string, Date | string>;

export interface DriverTable {
  createdAt: CreateTimestamp;
  discordId: string;
  firstName: string;
  id: Generated<number>;
  lastName: string;
  steamId: string;
  updatedAt: UpdateTimestamp;
}

export interface IncidentTable {
  createdAt: CreateTimestamp;
  description: string;
  driverId: number;
  id: Generated<number>;
  lapNumber: number;
  raceId: number;
  reportingDriverId: number;
  updatedAt: UpdateTimestamp;
}

export interface LeagueTable {
  createdAt: CreateTimestamp;
  description: string;
  id: Generated<number>;
  name: string;
  updatedAt: UpdateTimestamp;
}

export interface PenaltyTable {
  createdAt: CreateTimestamp;
  description: string;
  id: Generated<number>;
  name: string;
  updatedAt: UpdateTimestamp;
}

export interface PlatformTable {
  createdAt: CreateTimestamp;
  id: Generated<number>;
  name: string;
  updatedAt: UpdateTimestamp;
}

export interface RaceTable {
  createdAt: CreateTimestamp;
  id: Generated<number>;
  leagueId: number;
  name: string;
  seasonId: number;
  time: DateTime;
  updatedAt: UpdateTimestamp;
  week: number;
}

export interface RegistrationTable {
  createdAt: CreateTimestamp;
  driverId: number;
  id: Generated<number>;
  seasonId: number;
  updatedAt: UpdateTimestamp;
}

export interface RulingTable {
  createdAt: CreateTimestamp;
  id: Generated<number>;
  incidentId: number;
  penaltyId: number;
  updatedAt: UpdateTimestamp;
}

export interface SeasonTable {
  createdAt: CreateTimestamp;
  description: string;
  endDate: DateTime;
  id: Generated<number>;
  leagueId: number;
  name: string;
  platformId: number;
  startDate: DateTime;
  updatedAt: UpdateTimestamp;
}

export interface Database {
  drivers: DriverTable;
  incidents: IncidentTable;
  leagues: LeagueTable;
  penalties: PenaltyTable;
  platforms: PlatformTable;
  races: RaceTable;
  registrations: RegistrationTable;
  rulings: RulingTable;
  seasons: SeasonTable;
}
