import { type Static, Type } from '@sinclair/typebox';

export const DeleteStatus = Type.Object({
  status: Type.String()
});

export type DeleteStatus = Static<typeof DeleteStatus>;
