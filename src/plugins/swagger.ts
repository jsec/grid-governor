import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fp from 'fastify-plugin';

export default fp(async (server) => {
  await server.register(swagger);
  await server.register(swaggerUi, {
    routePrefix: '/docs',
    staticCSP: true,
    transformSpecification: (spec) => { return spec; },
    transformSpecificationClone: true,
    transformStaticCSP: header => header,
    uiConfig: {
      deepLinking: false,
      docExpansion: 'full'
    },
    uiHooks: {
      onRequest: function (_req, _res, next) { next(); },
      preHandler: function (_req, _res, next) { next(); }
    }
  });
});

