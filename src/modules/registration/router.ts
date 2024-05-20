import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import fp from 'fastify-plugin';

import type {
  Params, Registration, RegistrationRequest
} from './types.js';

import {
  CreateRegistrationSchema, GetRegistrationSchema, UpdateRegistrationSchema
} from './schema.js';
import {
  createRegistration, getRegistrationById, updateRegistration
} from './service.js';

const router: FastifyPluginAsyncTypebox = async (app) => {
  app.post<{ Body: RegistrationRequest }>(
    '/registration',
    { schema: CreateRegistrationSchema },
    async (request, reply) => {
      const result = await createRegistration(request.body);
      return reply.result(result);
    }
  );

  app.get<{ Params: Params }>(
    '/registration/:id',
    { schema: GetRegistrationSchema },
    async (request, reply) => {
      const result = await getRegistrationById(request.params.id);
      return reply.result(result);
    }
  );

  app.put<{ Body: Registration, Params: Params }>(
    '/registration/:id',
    { schema: UpdateRegistrationSchema },
    async (request, reply) => {
      const result = await updateRegistration(request.params.id, request.body);
      return reply.result(result);
    }
  );
};

export default fp(router, {
  name: 'registrationRouter'
});
