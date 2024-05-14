import { type Static, Type } from '@sinclair/typebox';

export const Penalty = Type.Object({
  createdAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
  description: Type.String(),
  id: Type.Integer(),
  name: Type.String(),
  updatedAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
});

export type Penalty = Static<typeof Penalty>;

export const PenaltyRequest = Type.Object({
  description: Type.String(),
  name: Type.String(),
});

export type PenaltyRequest = Static<typeof PenaltyRequest>;

export const Params = Type.Object({
  id: Type.Integer()
});

export type Params = Static<typeof Params>;

