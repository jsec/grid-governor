import type {
  Generated, Insertable, Selectable, Updateable
} from 'kysely';

export interface IncidentSchema {
  createdAt: Generated<Date>,
  description: string,
  driverId: number,
  id: Generated<number>,
  lapNumber: number,
  raceId: number,
  reportingDriverId: number,
  updatedAt: Generated<Date>,
}

export type Incident = Selectable<IncidentSchema>;
export type NewIncident = Insertable<IncidentSchema>;
export type IncidentUpdate = Updateable<IncidentSchema>;
