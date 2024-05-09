// eslint-disable-next-line import/default
import AutoLoad from '@fastify/autoload';
import fastify from 'fastify';
import dns from 'node:dns';
import { join } from 'node:path';

import { env } from './shared/env.js';
import { getLoggerByEnv } from './shared/logger.js';

dns.setDefaultResultOrder('ipv4first');

const server = fastify({
  logger: getLoggerByEnv[env.NODE_ENV]
});

server.register(AutoLoad, {
  dir: join(import.meta.dirname, 'plugins')
});

server.get('/ping', async () => {
  return 'pong\n';
});

server.listen({ host: env.API_HOST, port: env.API_PORT }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`Server listening at ${address}`);
});
