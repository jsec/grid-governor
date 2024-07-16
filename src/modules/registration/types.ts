import { type Static, Type } from '@sinclair/typebox';

export const Registration = Type.Object({
  createdAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
  driverId: Type.Integer(),
  id: Type.Integer(),
  seasonId: Type.Integer(),
  updatedAt: Type.Unsafe<Date | string>({ format: 'date-time' })
});

export type Registration = Static<typeof Registration>;

export const RegistrationRequest = Type.Object({
  driverId: Type.Integer(),
  seasonId: Type.Integer(),
});

export type RegistrationRequest = Static<typeof RegistrationRequest>;
