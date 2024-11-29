import autoLoad from '@fastify/autoload';
import fastify from 'fastify';
import path from 'node:path';

import { env } from './common/env.js';
import { getLoggerByEnv } from './common/logger.js';

export const createApp = () => {
  const app = fastify({
    logger: getLoggerByEnv[env.NODE_ENV],
  });

  // Load plugins
  app.register(autoLoad, {
    dir: path.join(import.meta.dirname, 'plugins'),
  });

  // Load routes
  app.register(autoLoad, {
    dir: path.join(import.meta.dirname, 'modules'),
    matchFilter: path => path.includes('router.ts'),
  });

  return app;
};
