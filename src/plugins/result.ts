import type { FastifyReply } from 'fastify';
import type { Result } from 'neverthrow';

import { type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import fp from 'fastify-plugin';
import { StatusCodes } from 'http-status-codes';

import type { AppError } from '../types/errors/app.error.js';

declare module 'fastify' {
  interface FastifyReply {
    result: <T>(result: Result<T, AppError>) => FastifyReply,
  }
}

export default fp<FastifyPluginAsyncTypebox>(async (app) => {
  app.decorateReply('result', function <T>(this: FastifyReply, result: Result<T, AppError>) {
    if (result.isOk()) {
      if (this.request.method === 'POST') {
        this.statusCode = StatusCodes.CREATED;
      }

      return this.send(result.value);
    }

    return this.status(result.error.statusCode).send(result.error);
  });
});
