import { type Static, Type } from '@sinclair/typebox';

export const Season = Type.Object({
  createdAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
  description: Type.String(),
  endDate: Type.Unsafe<Date | string>({ format: 'date-time' }),
  id: Type.Integer(),
  leagueId: Type.Integer(),
  name: Type.String(),
  platformId: Type.Integer(),
  startDate: Type.Unsafe<Date | string>({ format: 'date-time' }),
  updatedAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
});

export type Season = Static<typeof Season>;

export const SeasonRequest = Type.Object({
  description: Type.String(),
  endDate: Type.String({ format: 'date-time' }),
  leagueId: Type.Integer(),
  name: Type.String(),
  platformId: Type.Integer(),
  startDate: Type.String({ format: 'date-time' }),
});

export type SeasonRequest = Static<typeof SeasonRequest>;

export const Params = Type.Object({
  id: Type.Integer()
});

export type Params = Static<typeof Params>;
