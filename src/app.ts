// eslint-disable-next-line import/default
import autoLoad from '@fastify/autoload';
import fastify from 'fastify';
import { join } from 'node:path';

import { env } from './shared/env.js';
import { getLoggerByEnv } from './shared/logger.js';

export const createApp = () => {
  const app = fastify({
    logger: getLoggerByEnv[env.NODE_ENV]
  });

  // Load plugins
  app.register(autoLoad, {
    dir: join(import.meta.dirname, 'plugins')
  });

  // Load routes
  app.register(autoLoad, {
    dir: join(import.meta.dirname, 'routes'),
    matchFilter: path => path.includes('routes.ts')
  });

  return app;
};
