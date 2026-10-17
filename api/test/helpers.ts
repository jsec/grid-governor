import type { DB } from '@grid-governor/core/db/types';
import type { Kysely } from 'kysely';

import { type Auth, createAuth } from '@grid-governor/core/auth';
import { createLogger } from '@grid-governor/core/logging';

import type { AuthRouteHandler } from '../src/auth/invite-handler.ts';

import { createApp } from '../src/app.ts';

export const testPassword = 'test-password-123';

export const createTestLogger = () => {
    const lines: string[] = [];

    const logger = createLogger({
        config: {
            APP_RELEASE: 'a1b2c3d',
            LOG_LEVEL: 'info',
        },
        destination: {
            write: (line: string) => {
                lines.push(line);
            },
        },
        service: 'api',
    });

    return { lines, logger };
};

export const createTestApp = (db: Kysely<DB>, authHandler: AuthRouteHandler) => {
    const { lines, logger } = createTestLogger();

    const auth = createAuth(db, {
        BETTER_AUTH_SECRET: 'a-secret-long-enough-for-the-integration-test',
        BETTER_AUTH_URL: 'http://localhost:3000',
    });

    const app = createApp({
        auth,
        authHandler,
        config: { WEB_URL: 'http://localhost:5173' },
        db,
        logger,
    });

    return { app, auth, lines };
};

export const signIn = async (auth: Auth, email: string) => {
    const response = await auth.api.signInEmail({
        asResponse: true,
        body: { email, password: testPassword },
    });

    const cookie = response.headers.get('set-cookie')?.split(';', 1)[0];

    if (!cookie) {
        throw new Error('Sign-in did not return a session cookie');
    }

    return cookie;
};
