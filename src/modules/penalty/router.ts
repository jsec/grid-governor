import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import fp from 'fastify-plugin';

import type { IdParam } from '../../types/schemas.js';
import type { Penalty, PenaltyRequest } from './types.js';

import {
  CreatePenaltySchema,
  DeletePenaltySchema,
  GetPenaltySchema,
  UpdatePenaltySchema
} from './schema.js';
import {
  createPenalty,
  deletePenalty,
  getPenaltyById,
  updatePenalty
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

  server.get<{ Params: IdParam, Reply: Penalty }>(
    '/penalty/:id',
    { schema: GetPenaltySchema },
    async (request, reply) => {
      const penalty = await getPenaltyById(request.params.id);
      return reply.result(penalty);
    }
  );

  server.put<{ Body: Penalty, Params: IdParam, Reply: Penalty }>(
    '/penalty/:id',
    { schema: UpdatePenaltySchema },
    async (request, reply) => {
      const update = await updatePenalty(request.params.id, request.body);
      return reply.result(update);
    }
  );

  server.delete<{ Params: IdParam }>(
    '/penalty/:id',
    { schema: DeletePenaltySchema },
    async (request, reply) => {
      const result = await deletePenalty(request.params.id);
      return reply.result(result);
    }
  );
};

export default fp(router, {
  name: 'penaltyRouter'
});
