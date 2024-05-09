import sensible, { type SensibleOptions } from '@fastify/sensible';
import fp from 'fastify-plugin';

export default fp<SensibleOptions>(async (fastify) => {
  fastify.register(sensible);
});
