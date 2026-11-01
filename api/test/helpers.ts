import type { DB, User } from '@grid-governor/core/db/types';
import type { Insertable, Kysely } from 'kysely';

import { type Auth, createAuth } from '@grid-governor/core/auth';
import { createLogger } from '@grid-governor/core/logging';
import { hashPassword } from 'better-auth/crypto';

import { createApp } from '../src/app.ts';
import { recordEmails } from './emails.ts';

export const testPassword = 'test-password-123';

const passwordHash = await hashPassword(testPassword);

const testUsers = [
    {
        email: 'owner@example.test',
        id: 'owner',
        name: 'Owner',
        role: 'user',
    },
    {
        email: 'admin@example.test',
        id: 'admin',
        name: 'Admin',
        role: 'user',
    },
    {
        email: 'member@example.test',
        id: 'member',
        name: 'Member',
        role: 'user',
    },
    {
        email: 'driver@example.test',
        id: 'driver',
        name: 'Driver',
        role: 'user',
    },
    {
        email: 'global-admin@example.test',
        id: 'global-admin',
        name: 'Global',
        role: 'admin',
    },
];

const testMembers = [
    { role: 'owner', userId: 'owner' },
    { role: 'admin', userId: 'admin' },
    { role: 'member', userId: 'member' },
    { role: 'member', userId: 'driver' },
];

export const seedUsers = async (db: Kysely<DB>, users: Insertable<User>[]) => {
    await db.insertInto('user')
        .values(users)
        .execute();

    await db.insertInto('account')
        .values(users.map(user => ({
            accountId: user.id,
            id: `account-${user.id}`,
            issuer: 'local:credential',
            password: passwordHash,
            providerId: 'credential',
            userId: user.id,
        })))
        .execute();
};

export const seedOrganization = async (db: Kysely<DB>) => {
    await seedUsers(db, testUsers);

    await db.insertInto('organization')
        .values({
            banLengthRounds: 3,
            id: 'grid-club',
            name: 'Grid Club',
            slug: 'grid-club',
            suspensionThresholdPoints: 12,
        })
        .execute();

    await db.insertInto('member')
        .values(testMembers.map(({ role, userId }) => ({
            createdAt: new Date(),
            id: `member-${userId}`,
            organizationId: 'grid-club',
            role,
            userId,
        })))
        .execute();
};

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

export const createTestAuth = (db: Kysely<DB>) => createAuth(db, {
    BETTER_AUTH_SECRET: 'a-secret-long-enough-for-the-integration-test',
    BETTER_AUTH_URL: 'http://localhost:3000',
});

export const createTestApp = (db: Kysely<DB>) => {
    const { lines, logger } = createTestLogger();
    const auth = createTestAuth(db);
    const { emails } = recordEmails();

    const app = createApp({
        auth,
        config: {
            INVITATION_FROM_EMAIL: 'invites@example.test',
            WEB_URL: 'http://localhost:5173',
        },
        db,
        emails,
        logger,
    });

    return {
        app,
        auth,
        lines,
    };
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
