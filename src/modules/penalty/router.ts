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
    async (request, reply) => {
      const penalty = await createPenalty(request.body);
      return reply.result(penalty);
    }
  );

  server.get<{ Params: Params, Reply: Penalty }>(
    '/penalty/:id',
    { schema: GetPenaltySchema },
    async (request, reply) => {
      const penalty = await getPenaltyById(request.params.id);
      return reply.result(penalty);
    }
  );

  server.put<{ Body: Penalty, Params: Params, Reply: Penalty }>(
    '/penalty/:id',
    { schema: UpdatePenaltySchema },
    async (request, reply) => {
      const update = await updatePenalty(request.params.id, request.body);
      return reply.result(update);
    }
  );
};

export default fp(router, {
  name: 'penaltyRouter'
});
