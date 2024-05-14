import { type Static, Type } from '@sinclair/typebox';

export const Driver = Type.Object({
  createdAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
  discordId: Type.Optional(Type.String()),
  firstName: Type.String(),
  id: Type.Integer(),
  lastName: Type.String(),
  steamId: Type.Optional(Type.String()),
  updatedAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
});

export type Driver = Static<typeof Driver>;

export const DriverRequest = Type.Object({
  discordId: Type.Optional(Type.String()),
  firstName: Type.String(),
  lastName: Type.String(),
  steamId: Type.Optional(Type.String())
});

export type DriverRequest = Static<typeof DriverRequest>;

export const Params = Type.Object({
  id: Type.Integer()
});

export type Params = Static<typeof Params>;
