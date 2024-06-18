import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import fp from 'fastify-plugin';

import type {
  Driver, DriverRequest, Params
} from './types.js';

import {
  CreateDriverSchema, GetDriverSchema, UpdateDriverSchema
} from './schema.js';
import {
  createDriver, deleteDriver, getDriverById, updateDriver
} from './service.js';

const router: FastifyPluginAsyncTypebox = async (server) => {
  server.post<{ Body: DriverRequest, Reply: Driver }>(
    '/driver',
    { schema: CreateDriverSchema },
    async (request, reply) => {
      const driver = await createDriver(request.body);
      return reply.result(driver);
    }
  );

  server.get<{ Params: Params, Reply: Driver }>(
    '/driver/:id',
    { schema: GetDriverSchema },
    async (request, reply) => {
      const driver = await getDriverById(request.params.id);
      return reply.result(driver);
    }
  );

  server.put<{ Body: Driver, Params: Params, Reply: Driver }>(
    '/driver/:id',
    { schema: UpdateDriverSchema },
    async (request, reply) => {
      const update = await updateDriver(request.params.id, request.body);
      return reply.result(update);
    }
  );

  server.delete<{ Params: Params }>(
    '/driver/:id',
    async (request, reply) => {
      const result = await deleteDriver(request.params.id);
      return reply.result(result);
    }
  );
};

export default fp(router, {
  name: 'driverRouter'
});
