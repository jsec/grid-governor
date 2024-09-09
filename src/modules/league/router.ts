import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import fp from 'fastify-plugin';

import type { IdParam } from '../../types/schemas.js';
import type { League, LeagueRequest } from './types.js';

import {
  CreateLeagueSchema,
  DeleteLeagueSchema,
  GetLeagueSchema,
  UpdateLeagueSchema
} from './schema.js';
import {
  createLeague,
  deleteLeague,
  getLeagueById,
  updateLeague
} from './service.js';

const router: FastifyPluginAsyncTypebox = async (server) => {
  server.post<{ Body: LeagueRequest, Reply: League }>(
    '/league',
    { schema: CreateLeagueSchema },
    async (request, reply) => {
      const result = await createLeague(request.body);
      return reply.result(result);
    }
  );

  server.get<{ Params: IdParam, Reply: League }>(
    '/league/:id',
    { schema: GetLeagueSchema },
    async (request, reply) => {
      const league = await getLeagueById(request.params.id);
      return reply.result(league);
    }
  );

  server.put<{ Body: League, Params: IdParam, Reply: League }>(
    '/league/:id',
    { schema: UpdateLeagueSchema },
    async (request, reply) => {
      const update = await updateLeague(request.params.id, request.body);
      return reply.result(update);
    }
  );

  server.delete<{ Params: IdParam }>(
    '/league/:id',
    { schema: DeleteLeagueSchema },
    async (request, reply) => {
      const result = await deleteLeague(request.params.id);
      return reply.result(result);
    }
  );
};

export default fp(router, {
  name: 'leagueRouter'
});
