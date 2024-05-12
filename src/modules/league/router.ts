import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import fp from 'fastify-plugin';

import type {
  League, LeagueRequest, Params
} from './types.js';

import {
  CreateLeagueSchema, GetLeagueSchema, UpdateLeagueSchema
} from './schema.js';
import {
  createLeague, getLeagueById, updateLeague
} from './service.js';

const router: FastifyPluginAsyncTypebox = async (server) => {
  server.post<{ Body: LeagueRequest, Reply: League }>(
    '/league',
    { schema: CreateLeagueSchema },
    async (req, res) => {
      const league = await createLeague(req.body);
      res.status(201).send(league);
    }
  );

  server.get<{ Params: Params, Reply: League }>(
    '/league/:id',
    { schema: GetLeagueSchema },
    async (req, res) => {
      const league = await getLeagueById(req.params.id);
      res.status(200).send(league);
    }
  );

  server.put<{ Body: League, Params: Params, Reply: League }>(
    '/league/:id',
    { schema: UpdateLeagueSchema },
    async (req, res) => {
      const update = await updateLeague(req.params.id, req.body);
      res.status(200).send(update);
    }
  );
};

export default fp(router, {
  name: 'leagueRouter'
});
