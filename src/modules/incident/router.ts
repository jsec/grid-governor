import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import fp from 'fastify-plugin';

import type {
  Incident, IncidentRequest, Params
} from './types.js';

import {
  CreateIncidentSchema, GetIncidentSchema, UpdateIncidentSchema
} from './schema.js';
import {
  createIncident, getIncidentById, updateIncident
} from './service.js';

const router: FastifyPluginAsyncTypebox = async (app) => {
  app.post<{ Body: IncidentRequest }>(
    '/incident',
    { schema: CreateIncidentSchema },
    async (request, reply) => {
      const result = await createIncident(request.body);
      return reply.result(result);
    }
  );

  app.get<{ Params: Params }>(
    '/incident/:id',
    { schema: GetIncidentSchema },
    async (request, reply) => {
      const result = await getIncidentById(request.params.id);
      return reply.result(result);
    }
  );

  app.put<{ Body: Incident, Params: Params }>(
    '/incident/:id',
    { schema: UpdateIncidentSchema },
    async (request, reply) => {
      const result = await updateIncident(request.params.id, request.body);
      return reply.result(result);
    }
  );
};

export default fp(router, {
  name: 'incidentRouter'
});
