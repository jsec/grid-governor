import { type Static, Type } from '@sinclair/typebox';

export const IdParam = Type.Object({
  id: Type.Integer()
});

export type IdParam = Static<typeof IdParam>;
