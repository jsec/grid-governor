import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import fp from 'fastify-plugin';

import type { IdParam } from '../../types/schemas.js';
import type { Ruling, RulingRequest } from './types.js';

import {
  CreateRulingSchema,
  DeleteRulingSchema,
  GetRulingSchema,
  UpdateRulingSchema
} from './schema.js';
import {
  createRuling,
  deleteRuling,
  getRulingById,
  updateRuling
} from './service.js';

const router: FastifyPluginAsyncTypebox = async (server) => {
  server.post<{ Body: RulingRequest }>(
    '/ruling',
    { schema: CreateRulingSchema },
    async (request, reply) => {
      const result = await createRuling(request.body);
      return reply.result(result);
    }
  );

  server.get<{ Params: IdParam }>(
    '/ruling/:id',
    { schema: GetRulingSchema },
    async (request, reply) => {
      const result = await getRulingById(request.params.id);
      return reply.result(result);
    }
  );

  server.put<{ Body: Ruling, Params: IdParam }>(
    '/ruling/:id',
    { schema: UpdateRulingSchema },
    async (request, reply) => {
      const result = await updateRuling(request.params.id, request.body);
      return reply.result(result);
    }
  );

  server.delete<{ Params: IdParam }>(
    '/ruling/:id',
    { schema: DeleteRulingSchema },
    async (request, reply) => {
      const result = await deleteRuling(request.params.id);
      return reply.result(result);
    }
  );
};

export default fp(router, {
  name: 'rulingRouter'
});
