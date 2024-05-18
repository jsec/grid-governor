import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import fp from 'fastify-plugin';

import type { AppError } from '../../types/errors/app.error.js';
import type {
  Params, Season, SeasonRequest
} from './types.js';

import {
  CreateSeasonSchema, GetSeasonSchema, UpdateSeasonSchema
} from './schema.js';
import {
  createSeason, getSeasonById, updateSeason
} from './service.js';

const router: FastifyPluginAsyncTypebox = async (server) => {
  server.post<{ Body: SeasonRequest, Reply: Season }>(
    '/season',
    { schema: CreateSeasonSchema },
    async (req, res) => {
      const result = await createSeason(req.body);
      return result.match(
        (season: Season) => res.status(201).send(season),
        // FIXME: need to expose errors on the OAS schema and map app errors
        (err: AppError) => res.status(500).send(err)
      );
    }
  );

  server.get<{ Params: Params, Reply: Season }>(
    '/season/:id',
    { schema: GetSeasonSchema },
    async (req, res) => {
      const result = await getSeasonById(req.params.id);
      return result.match(
        (season: Season) => res.status(200).send(season),
        // FIXME: need to expose errors on the OAS schema and map app errors
        (err: AppError) => res.status(500).send(err)
      );
    }
  );

  server.put<{ Body: Season, Params: Params, Reply: Season }>(
    '/season/:id',
    { schema: UpdateSeasonSchema },
    async (req, res) => {
      const result = await updateSeason(req.params.id, req.body);
      return result.match(
        (season: Season) => res.status(200).send(season),
        // FIXME: need to expose errors on the OAS schema and map app errors
        (err: AppError) => res.status(500).send(err)
      );
    }
  );
};

export default fp(router, {
  name: 'seasonRouter'
});
