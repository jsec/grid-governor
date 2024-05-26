import type { FastifyInstance } from 'fastify';
import type { Kysely } from 'kysely';

import { test as base } from 'vitest';

import type { Database } from '../../src/db/schema/schema.js';

import { createApp } from '../../src/app.js';
import { db } from '../../src/db/conn.js';

export interface BaseContext {
  app: FastifyInstance,
  db: Kysely<Database>,
}

export const test = base.extend<BaseContext>({
  app: createApp(),
  db: db
});
