import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import fp from 'fastify-plugin';

import type { IdParam } from '../../types/schemas.js';
import type { Race, RaceRequest } from './types.js';

import {
  CreateRaceSchema,
  DeleteRaceSchema,
  GetRaceSchema,
  UpdateRaceSchema,
} from './schema.js';
import {
  createRace,
  deleteRace,
  getRaceById,
  updateRace,
} from './service.js';

const router: FastifyPluginAsyncTypebox = async (server) => {
  server.post<{ Body: RaceRequest }>(
    '/race',
    { schema: CreateRaceSchema },
    async (request, reply) => {
      const result = await createRace(request.body);
      return reply.result(result);
    },
  );

  server.get<{ Params: IdParam }>(
    '/race/:id',
    { schema: GetRaceSchema },
    async (request, reply) => {
      const result = await getRaceById(request.params.id);
      return reply.result(result);
    },
  );

  server.put<{ Body: Race; Params: IdParam }>(
    '/race/:id',
    { schema: UpdateRaceSchema },
    async (request, reply) => {
      const result = await updateRace(request.params.id, request.body);
      return reply.result(result);
    },
  );

  server.delete<{ Params: IdParam }>(
    '/race/:id',
    { schema: DeleteRaceSchema },
    async (request, reply) => {
      const result = await deleteRace(request.params.id);
      return reply.result(result);
    },
  );
};

export default fp(router, {
  name: 'raceRouter',
});
