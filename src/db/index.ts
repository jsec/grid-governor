import type { DB } from 'kysely-codegen';

import {
  CamelCasePlugin, Kysely, MysqlDialect
} from 'kysely';
import { createPool } from 'mysql2';

import { env } from '../shared/env.js';

const dialect = new MysqlDialect({
  pool: createPool({
    connectionLimit: 10,
    database: env.DB_NAME,
    host: env.DB_HOST,
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
    user: env.DB_USER
  })
});

const plugins = [
  new CamelCasePlugin()
];

export const db = new Kysely<DB>({ dialect, plugins });
