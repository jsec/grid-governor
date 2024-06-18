import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import fp from 'fastify-plugin';

import type {
  Params, Race, RaceRequest
} from './types.js';

import {
  CreateRaceSchema, GetRaceSchema, UpdateRaceSchema
} from './schema.js';
import {
  createRace, deleteRace, getRaceById, updateRace
} from './service.js';

const router: FastifyPluginAsyncTypebox = async (server) => {
  server.post<{ Body: RaceRequest }>(
    '/race',
    { schema: CreateRaceSchema },
    async (request, reply) => {
      const result = await createRace(request.body);
      return reply.result(result);
    }
  );

  server.get<{ Params: Params }>(
    '/race/:id',
    { schema: GetRaceSchema },
    async (request, reply) => {
      const result = await getRaceById(request.params.id);
      return reply.result(result);
    }
  );

  server.put<{ Body: Race, Params: Params }>(
    '/race/:id',
    { schema: UpdateRaceSchema },
    async (request, reply) => {
      const result = await updateRace(request.params.id, request.body);
      return reply.result(result);
    }
  );

  server.delete<{ Params: Params }>(
    '/race/:id',
    async (request, reply) => {
      const result = await deleteRace(request.params.id);
      return reply.result(result);
    }
  );
};

export default fp(router, {
  name: 'raceRouter'
});
