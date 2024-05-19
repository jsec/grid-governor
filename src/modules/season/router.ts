import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import fp from 'fastify-plugin';

import {
  CreateSeasonSchema, GetSeasonSchema, UpdateSeasonSchema
} from './schema.js';
import {
  createSeason, getSeasonById, updateSeason
} from './service.js';
import {
  type Params,
  type Season, SeasonRequest
} from './types.js';

const router: FastifyPluginAsyncTypebox = async (app) => {
  app.post<{ Body: SeasonRequest }>(
    '/season',
    { schema: CreateSeasonSchema },
    async (request, reply) => {
      const result = await createSeason(request.body);
      return reply.result(result);
    }
  );

  app.get<{ Params: Params }>(
    '/season/:id',
    { schema: GetSeasonSchema },
    async (request, reply) => {
      const result = await getSeasonById(request.params.id);
      return reply.result(result);
    }
  );

  app.put<{ Body: Season, Params: Params }>(
    '/season/:id',
    { schema: UpdateSeasonSchema },
    async (request, reply) => {
      const result = await updateSeason(request.params.id, request.body);
      return reply.result(result);
    }
  );
};

export default fp(router, {
  name: 'seasonRouter'
});
