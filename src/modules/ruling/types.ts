import { type Static, Type } from '@sinclair/typebox';

export const Ruling = Type.Object({
  createdAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
  id: Type.Integer(),
  incidentId: Type.Integer(),
  penaltyId: Type.Integer(),
  updatedAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
});

export type Ruling = Static<typeof Ruling>;

export const RulingRequest = Type.Object({
  incidentId: Type.Integer(),
  penaltyId: Type.Integer(),
});

export type RulingRequest = Static<typeof RulingRequest>;

export const Params = Type.Object({
  id: Type.Integer()
});

export type Params = Static<typeof Params>;
