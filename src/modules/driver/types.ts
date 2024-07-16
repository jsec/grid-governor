import { type Static, Type } from '@sinclair/typebox';

export const Driver = Type.Object({
  createdAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
  discordId: Type.String(),
  firstName: Type.String(),
  id: Type.Integer(),
  lastName: Type.String(),
  steamId: Type.String(),
  updatedAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
});

export type Driver = Static<typeof Driver>;

export const DriverRequest = Type.Object({
  discordId: Type.String(),
  firstName: Type.String(),
  lastName: Type.String(),
  steamId: Type.String()
});

export type DriverRequest = Static<typeof DriverRequest>;
