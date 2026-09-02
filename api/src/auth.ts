import type { Kysely } from 'kysely';

import { kyselyAdapter } from '@better-auth/kysely-adapter';
import { betterAuth } from 'better-auth';

import type { DB } from './db/types.js';

export type AuthHandler = (request: Request) => Promise<Response> | Response;

export const createAuth = (db: Kysely<DB>, authUrl: string, authSecret: string) => {
    return betterAuth({
        baseURL: authUrl,
        database: kyselyAdapter(db, { type: 'postgres' }),
        secret: authSecret,
    });
};
