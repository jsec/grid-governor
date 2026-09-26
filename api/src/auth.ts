import type { Kysely } from 'kysely';

import { kyselyAdapter } from '@better-auth/kysely-adapter';
import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';

import type { DB } from './db/types.js';

import { loadConfig } from './config/config.js';
import { createDatabase } from './db/client.js';

export type AuthHandler = (request: Request) => Promise<Response> | Response;

export const createAuth = (db: Kysely<DB>, authUrl: string, authSecret: string) => {
    return betterAuth({
        baseURL: authUrl,
        database: kyselyAdapter(db, { type: 'postgres' }),
        plugins: [
            admin(),
        ],
        secret: authSecret,
    });
};

export const auth = () => {
    const { betterAuthSecret, betterAuthUrl, databaseUrl } = loadConfig();

    return createAuth(
        createDatabase(databaseUrl),
        betterAuthUrl,
        betterAuthSecret,
    );
};
