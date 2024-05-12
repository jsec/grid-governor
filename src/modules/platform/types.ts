import { type Static, Type } from '@sinclair/typebox';

export const Platform = Type.Object({
  createdAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
  id: Type.Integer(),
  name: Type.String(),
  updatedAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
});

export type Platform = Static<typeof Platform>;

export const PlatformRequest = Type.Object({
  name: Type.String()
});

export type PlatformRequest = Static<typeof PlatformRequest>;

export const Params = Type.Object({
  id: Type.Integer()
});

export type Params = Static<typeof Params>;
