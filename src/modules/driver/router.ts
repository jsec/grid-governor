import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import fp from 'fastify-plugin';

import type { IdParam } from '../../types/schemas.js';
import type { Driver, DriverRequest } from './types.js';

import {
  CreateDriverSchema,
  DeleteDriverSchema,
  GetDriverSchema,
  UpdateDriverSchema
} from './schema.js';
import {
  createDriver,
  deleteDriver,
  getDriverById,
  updateDriver
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

  server.get<{ Params: IdParam, Reply: Driver }>(
    '/driver/:id',
    { schema: GetDriverSchema },
    async (request, reply) => {
      const driver = await getDriverById(request.params.id);
      return reply.result(driver);
    }
  );

  server.put<{ Body: Driver, Params: IdParam, Reply: Driver }>(
    '/driver/:id',
    { schema: UpdateDriverSchema },
    async (request, reply) => {
      const update = await updateDriver(request.params.id, request.body);
      return reply.result(update);
    }
  );

  server.delete<{ Params: IdParam }>(
    '/driver/:id',
    { schema: DeleteDriverSchema },
    async (request, reply) => {
      const result = await deleteDriver(request.params.id);
      return reply.result(result);
    }
  );
};

export default fp(router, {
  name: 'driverRouter'
});
