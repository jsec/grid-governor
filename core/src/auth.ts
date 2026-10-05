import type { Kysely } from 'kysely';

import { kyselyAdapter } from '@better-auth/kysely-adapter';
import { betterAuth } from 'better-auth';
import { admin, organization } from 'better-auth/plugins';

import type { Config } from './config/config.ts';
import type { DB } from './db/types.ts';

export const createAuth = (
    db: Kysely<DB>,
    config: Pick<Config, 'BETTER_AUTH_SECRET' | 'BETTER_AUTH_URL'>,
) => {
    return betterAuth({
        advanced: { database: { joins: true } },
        baseURL: config.BETTER_AUTH_URL,
        database: kyselyAdapter(db, { type: 'postgres' }),
        emailAndPassword: {
            disableSignUp: true,
            enabled: true,
        },
        plugins: [
            admin(),
            organization({
                allowUserToCreateOrganization: user => user.role === 'admin',
                disableOrganizationDeletion: true,
                schema: {
                    organization: {
                        additionalFields: {
                            appealDecisionSlaHours: {
                                required: false,
                                type: 'number',
                            },
                            appealQuotaPerSeason: {
                                required: false,
                                type: 'number',
                            },
                            appealWindowHours: {
                                required: false,
                                type: 'number',
                            },
                            archivedAt: {
                                input: false,
                                required: false,
                                type: 'date',
                            },
                            banLengthRounds: {
                                required: true,
                                type: 'number',
                            },
                            suspensionThresholdPoints: {
                                required: true,
                                type: 'number',
                            },
                        },
                    },
                },
            }),
        ],
        secret: config.BETTER_AUTH_SECRET,
    });
};

export type AuthHandler = ReturnType<typeof createAuth>['handler'];
