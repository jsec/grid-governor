import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import fp from 'fastify-plugin';

import type {
  Params, Race, RaceRequest
} from './types.js';

import {
  CreateRaceSchema, GetRaceSchema, UpdateRaceSchema
} from './schema.js';
import {
  createRace, getRaceById, updateRace
} from './service.js';

const router: FastifyPluginAsyncTypebox = async (app) => {
  app.post<{ Body: RaceRequest }>(
    '/race',
    { schema: CreateRaceSchema },
    async (request, reply) => {
      const result = await createRace(request.body);
      return reply.result(result);
    }
  );

  app.get<{ Params: Params }>(
    '/race/:id',
    { schema: GetRaceSchema },
    async (request, reply) => {
      const result = await getRaceById(request.params.id);
      return reply.result(result);
    }
  );

  app.put<{ Body: Race, Params: Params }>(
    '/race/:id',
    { schema: UpdateRaceSchema },
    async (request, reply) => {
      const result = await updateRace(request.params.id, request.body);
      return reply.result(result);
    }
  );
};

export default fp(router, {
  name: 'raceRouter'
});
