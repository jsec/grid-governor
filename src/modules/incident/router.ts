import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import fp from 'fastify-plugin';

import type { IdParam } from '../../types/schemas.js';
import type { Incident, IncidentRequest } from './types.js';

import {
  CreateIncidentSchema,
  DeleteIncidentSchema,
  GetIncidentSchema,
  UpdateIncidentSchema
} from './schema.js';
import {
  createIncident,
  deleteIncident,
  getIncidentById,
  updateIncident
} from './service.js';

const router: FastifyPluginAsyncTypebox = async (server) => {
  server.post<{ Body: IncidentRequest }>(
    '/incident',
    { schema: CreateIncidentSchema },
    async (request, reply) => {
      const result = await createIncident(request.body);
      return reply.result(result);
    }
  );

  server.get<{ Params: IdParam }>(
    '/incident/:id',
    { schema: GetIncidentSchema },
    async (request, reply) => {
      const result = await getIncidentById(request.params.id);
      return reply.result(result);
    }
  );

  server.put<{ Body: Incident, Params: IdParam }>(
    '/incident/:id',
    { schema: UpdateIncidentSchema },
    async (request, reply) => {
      const result = await updateIncident(request.params.id, request.body);
      return reply.result(result);
    }
  );

  server.delete<{ Params: IdParam }>(
    '/incident/:id',
    { schema: DeleteIncidentSchema },
    async (request, reply) => {
      const result = await deleteIncident(request.params.id);
      return reply.result(result);
    }
  );
};

export default fp(router, {
  name: 'incidentRouter'
});
