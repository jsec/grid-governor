import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import fp from 'fastify-plugin';

import type {
  League, LeagueRequest, Params
} from './types.js';

import {
  CreateLeagueSchema, DeleteLeagueSchema, GetLeagueSchema, UpdateLeagueSchema
} from './schema.js';
import {
  createLeague, deleteLeague, getLeagueById, updateLeague
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

  server.get<{ Params: Params, Reply: League }>(
    '/league/:id',
    { schema: GetLeagueSchema },
    async (request, reply) => {
      const league = await getLeagueById(request.params.id);
      return reply.result(league);
    }
  );

  server.put<{ Body: League, Params: Params, Reply: League }>(
    '/league/:id',
    { schema: UpdateLeagueSchema },
    async (request, reply) => {
      const update = await updateLeague(request.params.id, request.body);
      return reply.result(update);
    }
  );

  server.delete<{ Params: Params }>(
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
