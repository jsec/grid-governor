import { type Static, Type } from '@sinclair/typebox';

export const Race = Type.Object({
  createdAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
  id: Type.Integer(),
  leagueId: Type.Number(),
  name: Type.String(),
  seasonId: Type.Number(),
  time: Type.String({ format: 'date-time' }),
  updatedAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
  week: Type.Number(),
});

export type Race = Static<typeof Race>;

export const RaceRequest = Type.Object({
  leagueId: Type.Number(),
  name: Type.String(),
  seasonId: Type.Number(),
  time: Type.String({ format: 'date-time' }),
  week: Type.Number(),
});

export type RaceRequest = Static<typeof RaceRequest>;

export const Params = Type.Object({
  id: Type.Integer()
});

export type Params = Static<typeof Params>;
