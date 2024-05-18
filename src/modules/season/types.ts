import { type Static, Type } from '@sinclair/typebox';

export const Season = Type.Object({
  createdAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
  description: Type.String(),
  endDate: Type.Union([Type.Date(), Type.Null()]),
  id: Type.Integer(),
  leagueId: Type.Integer(),
  name: Type.String(),
  platformId: Type.Integer(),
  startDate: Type.Date(),
  updatedAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
});

export type Season = Static<typeof Season>;

export const SeasonRequest = Type.Object({
  description: Type.String(),
  endDate: Type.Union([Type.Date(), Type.Null()]),
  leagueId: Type.Integer(),
  name: Type.String(),
  platformId: Type.Integer(),
  startDate: Type.Date(),
});

export type SeasonRequest = Static<typeof SeasonRequest>;

export const Params = Type.Object({
  id: Type.Integer()
});

export type Params = Static<typeof Params>;
