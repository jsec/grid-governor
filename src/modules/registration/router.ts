import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import fp from 'fastify-plugin';

import type { IdParam } from '../../types/schemas.js';
import type { Registration, RegistrationRequest } from './types.js';

import {
  CreateRegistrationSchema,
  DeleteRegistrationSchema,
  GetRegistrationSchema,
  UpdateRegistrationSchema,
} from './schema.js';
import {
  createRegistration,
  deleteRegistration,
  getRegistrationById,
  updateRegistration,
} from './service.js';

const router: FastifyPluginAsyncTypebox = async (server) => {
  server.post<{ Body: RegistrationRequest }>(
    '/registration',
    { schema: CreateRegistrationSchema },
    async (request, reply) => {
      const result = await createRegistration(request.body);
      return reply.result(result);
    },
  );

  server.get<{ Params: IdParam }>(
    '/registration/:id',
    { schema: GetRegistrationSchema },
    async (request, reply) => {
      const result = await getRegistrationById(request.params.id);
      return reply.result(result);
    },
  );

  server.put<{ Body: Registration; Params: IdParam }>(
    '/registration/:id',
    { schema: UpdateRegistrationSchema },
    async (request, reply) => {
      const result = await updateRegistration(request.params.id, request.body);
      return reply.result(result);
    },
  );

  server.delete<{ Params: IdParam }>(
    '/registration/:id',
    { schema: DeleteRegistrationSchema },
    async (request, reply) => {
      const result = await deleteRegistration(request.params.id);
      return reply.result(result);
    },
  );
};

export default fp(router, {
  name: 'registrationRouter',
});
