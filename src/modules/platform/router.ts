import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import fp from 'fastify-plugin';

import type { IdParam } from '../../types/schemas.js';

import {
  CreatePlatformSchema, DeletePlatformSchema, GetPlatformSchema, UpdatePlatformSchema
} from './schema.js';
import {
  createPlatform, deletePlatform, getPlatformById, updatePlatform
} from './service.js';
import {
  Platform, type PlatformRequest
} from './types.js';

const router: FastifyPluginAsyncTypebox = async (server) => {
  server.post<{ Body: PlatformRequest, Reply: Platform }>(
    '/platform',
    { schema: CreatePlatformSchema },
    async (request, reply) => {
      const platform = await createPlatform(request.body);
      return reply.result(platform);
    }
  );

  server.get<{ Params: IdParam, Reply: Platform }>(
    '/platform/:id',
    { schema: GetPlatformSchema },
    async (request, reply) => {
      const platform = await getPlatformById(request.params.id);
      return reply.result(platform);
    }
  );

  server.put<{ Body: Platform, Params: IdParam, Reply: Platform }>(
    '/platform/:id',
    { schema: UpdatePlatformSchema },
    async (request, reply) => {
      const update = await updatePlatform(request.params.id, request.body);
      return reply.result(update);
    }
  );

  server.delete<{ Params: IdParam }>(
    '/platform/:id',
    { schema: DeletePlatformSchema },
    async (request, reply) => {
      const result = await deletePlatform(request.params.id);
      return reply.result(result);
    }
  );
};

export default fp(router, {
  name: 'platformRouter'
});
