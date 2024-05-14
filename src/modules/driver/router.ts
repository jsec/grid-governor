import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import fp from 'fastify-plugin';

import type {
  Driver, DriverRequest, Params
} from './types.js';

import {
  CreateDriverSchema, GetDriverSchema, UpdateDriverSchema
} from './schema.js';
import {
  createDriver, getDriverById, updateDriver
} from './service.js';

const router: FastifyPluginAsyncTypebox = async (server) => {
  server.post<{ Body: DriverRequest, Reply: Driver }>(
    '/league',
    { schema: CreateDriverSchema },
    async (req, res) => {
      const league = await createDriver(req.body);
      res.status(201).send(league);
    }
  );

  server.get<{ Params: Params, Reply: Driver }>(
    '/league/:id',
    { schema: GetDriverSchema },
    async (req, res) => {
      const league = await getDriverById(req.params.id);
      res.status(200).send(league);
    }
  );

  server.put<{ Body: Driver, Params: Params, Reply: Driver }>(
    '/league/:id',
    { schema: UpdateDriverSchema },
    async (req, res) => {
      const update = await updateDriver(req.params.id, req.body);
      res.status(200).send(update);
    }
  );
};

export default fp(router, {
  name: 'driverRouter'
});
