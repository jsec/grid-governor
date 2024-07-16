import { type Static, Type } from '@sinclair/typebox';

export const League = Type.Object({
  createdAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
  description: Type.String(),
  id: Type.Integer(),
  name: Type.String(),
  updatedAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
});

export type League = Static<typeof League>;

export const LeagueRequest = Type.Object({
  description: Type.String(),
  name: Type.String(),
});

export type LeagueRequest = Static<typeof LeagueRequest>;
