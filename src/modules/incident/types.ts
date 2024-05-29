import { type Static, Type } from '@sinclair/typebox';

export const Incident = Type.Object({
  createdAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
  description: Type.String(),
  driverId: Type.Number(),
  id: Type.Integer(),
  lapNumber: Type.Number(),
  raceId: Type.Number(),
  reportingDriverId: Type.Number(),
  updatedAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
});

export type Incident = Static<typeof Incident>;

export const IncidentRequest = Type.Object({
  description: Type.String(),
  driverId: Type.Number(),
  lapNumber: Type.Number(),
  raceId: Type.Number(),
  reportingDriverId: Type.Number(),
});

export type IncidentRequest = Static<typeof IncidentRequest>;

export const Params = Type.Object({
  id: Type.Integer()
});

export type Params = Static<typeof Params>;
