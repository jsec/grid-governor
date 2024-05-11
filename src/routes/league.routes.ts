import type { FastifyPluginAsyncTypebox, Static } from '@fastify/type-provider-typebox';

import { Type } from '@sinclair/typebox';
import fp from 'fastify-plugin';

import { createLeague } from '../services/league.service.js';

const League = Type.Object({
  createdAt: Type.Optional(Type.Unsafe<Date | string>({ format: 'date-time' })),
  description: Type.String(),
  id: Type.Optional(Type.Integer()),
  name: Type.String(),
  updatedAt: Type.Optional(Type.Unsafe<Date | string>({ format: 'date-time' }))
});

type LeagueType = Static<typeof League>;

const schema = {
  body: League,
  response: {
    201: League,
  }
};

const router: FastifyPluginAsyncTypebox = async (server) => {
  server.post<{ Body: LeagueType, Reply: LeagueType }>(
    '/league',
    { schema },
    async (req, res) => {
      const league = await createLeague(req.body);
      res.status(201).send(league);
    }
  );
};

export default fp(router, {
  name: 'leagueRouter'
});
