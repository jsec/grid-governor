import type { Kysely } from 'kysely';

import { kyselyAdapter } from '@better-auth/kysely-adapter';
import { betterAuth } from 'better-auth';
import { admin, organization } from 'better-auth/plugins';

import type { Config } from './config/config.js';
import type { DB } from './db/types.js';

export const createAuth = (
    db: Kysely<DB>,
    config: Pick<Config, 'betterAuthSecret' | 'betterAuthUrl'>,
) => {
    return betterAuth({
        baseURL: config.betterAuthUrl,
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
                                fieldName: 'appeal_decision_sla_hours',
                                required: false,
                                type: 'number',
                            },
                            appealQuotaPerSeason: {
                                fieldName: 'appeal_quota_per_season',
                                required: false,
                                type: 'number',
                            },
                            appealWindowHours: {
                                fieldName: 'appeal_window_hours',
                                required: false,
                                type: 'number',
                            },
                            archivedAt: {
                                fieldName: 'archived_at',
                                input: false,
                                required: false,
                                type: 'date',
                            },
                            banLengthRounds: {
                                fieldName: 'ban_length_rounds',
                                required: true,
                                type: 'number',
                            },
                            suspensionThresholdPoints: {
                                fieldName: 'suspension_threshold_points',
                                required: true,
                                type: 'number',
                            },
                        },
                    },
                },
            }),
        ],
        secret: config.betterAuthSecret,
    });
};

export type AuthHandler = ReturnType<typeof createAuth>['handler'];
