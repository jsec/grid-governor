import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import fp from 'fastify-plugin';

const router: FastifyPluginAsyncTypebox = async (server) => {};

export default fp(router, {
  name: 'seasonRouter'
});
