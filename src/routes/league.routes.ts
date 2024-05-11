import type { FastifyPluginAsyncTypebox, Static } from '@fastify/type-provider-typebox';

import { Type } from '@sinclair/typebox';
import fp from 'fastify-plugin';

import { createLeague } from '../services/league.service.js';

const League = Type.Object({
  createdAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
  description: Type.String(),
  id: Type.Optional(Type.Integer()),
  name: Type.String(),
  updatedAt: Type.Unsafe<Date | string>({ format: 'date-time' }),
});

type LeagueType = Static<typeof League>;
type CreateLeagueType = Omit<LeagueType, 'createdAt' | 'id' | 'updatedAt'>;

const createSchema = {
  body: Type.Object({
    description: Type.String(),
    name: Type.String()
  }),
  response: {
    201: League,
  }
};

const router: FastifyPluginAsyncTypebox = async (server) => {
  server.post<{ Body: CreateLeagueType, Reply: LeagueType }>(
    '/league',
    { schema: createSchema },
    async (req, res) => {
      const league = await createLeague(req.body);
      res.status(201).send(league);
    }
  );

  // server.put<{ Body: LeagueType, Params: Params, Reply: LeagueType }>(
  // '/league/:id',
  // { schema: updateSchema },
  // async (req, res) => {
  //     const { id } = req.params;
  //     const update = await updateLeague(id, req.body);
  //     res.status(200).send(update);
  // }
  // );
};

export default fp(router, {
  name: 'leagueRouter'
});
