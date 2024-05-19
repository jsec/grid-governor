import { Type } from '@sinclair/typebox';

export const ErrorSchema = Type.Object({
  message: Type.String(),
  name: Type.String(),
  statusCode: Type.Integer()
});
