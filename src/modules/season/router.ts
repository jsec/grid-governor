import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import fp from 'fastify-plugin';

import type { IdParam } from '../../types/schemas.js';

import {
  CreateSeasonSchema,
  DeleteSeasonSchema,
  GetSeasonSchema,
  UpdateSeasonSchema,
} from './schema.js';
import {
  createSeason,
  deleteSeason,
  getSeasonById,
  updateSeason,
} from './service.js';
import { type Season, SeasonRequest } from './types.js';

const router: FastifyPluginAsyncTypebox = async (server) => {
  server.post<{ Body: SeasonRequest }>(
    '/season',
    { schema: CreateSeasonSchema },
    async (request, reply) => {
      const result = await createSeason(request.body);
      return reply.result(result);
    },
  );

  server.get<{ Params: IdParam }>(
    '/season/:id',
    { schema: GetSeasonSchema },
    async (request, reply) => {
      const result = await getSeasonById(request.params.id);
      return reply.result(result);
    },
  );

  server.put<{ Body: Season; Params: IdParam }>(
    '/season/:id',
    { schema: UpdateSeasonSchema },
    async (request, reply) => {
      const result = await updateSeason(request.params.id, request.body);
      return reply.result(result);
    },
  );

  server.delete<{ Params: IdParam }>(
    '/season/:id',
    { schema: DeleteSeasonSchema },
    async (request, reply) => {
      const result = await deleteSeason(request.params.id);
      return reply.result(result);
    },
  );
};

export default fp(router, {
  name: 'seasonRouter',
});
