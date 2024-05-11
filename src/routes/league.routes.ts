import type { FastifyPluginAsyncTypebox, Static } from '@fastify/type-provider-typebox';

import { Type } from '@sinclair/typebox';
import fp from 'fastify-plugin';

import { createLeague, updateLeague } from '../services/league.service.js';

const League = Type.Object({
  createdAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
  description: Type.String(),
  id: Type.Integer(),
  name: Type.String(),
  updatedAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
});

const LeagueRequest = Type.Object({
  description: Type.String(),
  name: Type.String(),
});

const Params = Type.Object({
  id: Type.Integer()
});

type League = Static<typeof League>;
type LeagueRequest = Static<typeof LeagueRequest>;
type Params = Static<typeof Params>;

const createSchema = {
  body: LeagueRequest,
  response: {
    201: League,
  },
  tags: [ 'League' ]
};

const updateSchema = {
  body: LeagueRequest,
  response: {
    200: League,
  },
  tags: [ 'League' ]
};

const router: FastifyPluginAsyncTypebox = async (server) => {
  server.post<{ Body: LeagueRequest, Reply: League }>(
    '/league',
    { schema: createSchema },
    async (req, res) => {
      const league = await createLeague(req.body);
      res.status(201).send(league);
    }
  );

  server.put<{ Body: League, Params: Params, Reply: League }>(
    '/league/:id',
    { schema: updateSchema },
    async (req, res) => {
      const { id } = req.params;
      const update = await updateLeague(id, req.body);
      res.status(200).send(update);
    }
  );
};

export default fp(router, {
  name: 'leagueRouter'
});
