import {
  CamelCasePlugin,
  Kysely,
  PostgresDialect
} from 'kysely';
import pg from 'pg';

import type { Database } from './schema.js';

import { env } from '../common/env.js';

const dialect = new PostgresDialect({
  pool: new pg.Pool({
    database: env.DB_NAME,
    host: env.DB_HOST,
    max: 10,
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
    user: env.DB_USER
  })
});

const plugins = [
  new CamelCasePlugin()
];

export const db = new Kysely<Database>({ dialect, plugins });
