import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import fp from 'fastify-plugin';

import {
  CreatePlatformSchema, GetPlatformSchema, UpdatePlatformSchema
} from './schema.js';
import {
  createPlatform, getPlatformById, updatePlatform
} from './service.js';
import {
  Params, Platform, type PlatformRequest
} from './types.js';

const router: FastifyPluginAsyncTypebox = async (server) => {
  server.post<{ Body: PlatformRequest, Reply: Platform }>(
    '/platform',
    { schema: CreatePlatformSchema },
    async (req, res) => {
      const platform = await createPlatform(req.body);
      res.status(201).send(platform);
    }
  );

  server.get<{ Params: Params, Reply: Platform }>(
    '/platform/:id',
    { schema: GetPlatformSchema },
    async (req, res) => {
      const platform = await getPlatformById(req.params.id);
      res.status(200).send(platform);
    }
  );

  server.put<{ Body: Platform, Params: Params, Reply: Platform }>(
    '/platform/:id',
    { schema: UpdatePlatformSchema },
    async (req, res) => {
      const update = await updatePlatform(req.params.id, req.body);
      res.status(200).send(update);
    }
  );
};

export default fp(router, {
  name: 'platformRouter'
});
