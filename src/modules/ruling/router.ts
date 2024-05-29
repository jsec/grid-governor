import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import fp from 'fastify-plugin';

import type {
  Params, Ruling, RulingRequest
} from './types.js';

import {
  CreateRulingSchema, GetRulingSchema, UpdateRulingSchema
} from './schema.js';
import {
  createRuling, getRulingById, updateRuling
} from './service.js';

const router: FastifyPluginAsyncTypebox = async (app) => {
  app.post<{ Body: RulingRequest }>(
    '/ruling',
    { schema: CreateRulingSchema },
    async (request, reply) => {
      const result = await createRuling(request.body);
      return reply.result(result);
    }
  );

  app.get<{ Params: Params }>(
    '/ruling/:id',
    { schema: GetRulingSchema },
    async (request, reply) => {
      const result = await getRulingById(request.params.id);
      return reply.result(result);
    }
  );

  app.put<{ Body: Ruling, Params: Params }>(
    '/ruling/:id',
    { schema: UpdateRulingSchema },
    async (request, reply) => {
      const result = await updateRuling(request.params.id, request.body);
      return reply.result(result);
    }
  );
};

export default fp(router, {
  name: 'rulingRouter'
});
