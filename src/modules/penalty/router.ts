import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import fp from 'fastify-plugin';

import type {
  Params, Penalty, PenaltyRequest
} from './types.js';

import {
  CreatePenaltySchema, GetPenaltySchema, UpdatePenaltySchema
} from './schema.js';
import {
  createPenalty, getPenaltyById, updatePenalty
} from './service.js';

const router: FastifyPluginAsyncTypebox = async (server) => {
  server.post<{ Body: PenaltyRequest, Reply: Penalty }>(
    '/penalty',
    { schema: CreatePenaltySchema },
    async (req, res) => {
      const penalty = await createPenalty(req.body);
      res.status(201).send(penalty);
    }
  );

  server.get<{ Params: Params, Reply: Penalty }>(
    '/penalty/:id',
    { schema: GetPenaltySchema },
    async (req, res) => {
      const penalty = await getPenaltyById(req.params.id);
      res.status(200).send(penalty);
    }
  );

  server.put<{ Body: Penalty, Params: Params, Reply: Penalty }>(
    '/penalty/:id',
    { schema: UpdatePenaltySchema },
    async (req, res) => {
      const update = await updatePenalty(req.params.id, req.body);
      res.status(200).send(update);
    }
  );
};

export default fp(router, {
  name: 'penaltyRouter'
});
