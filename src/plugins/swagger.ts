import swagger from '@fastify/swagger';
import scalar from '@scalar/fastify-api-reference';
import fp from 'fastify-plugin';

export default fp(async (server) => {
  await server.register(swagger, {
    openapi: {
      info: {
        description: 'API documentation for the Grid Governor backend',
        title: 'Grid Governor API',
        version: '0.1.0',
      },
      openapi: '3.0.0',
    },
  });

  await server.register(scalar, {
    routePrefix: '/docs',
  });
});
