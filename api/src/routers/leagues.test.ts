import { leagueListSchema, leagueSchema } from '@grid-governor/core/schemas';
import { createTestDatabase, type TestDatabase } from '@grid-governor/core/testing/database';
import { hashPassword } from 'better-auth/crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, signIn, testPassword } from '../../test/helpers.ts';

const passwordHash = await hashPassword(testPassword);

const users = [
    { email: 'owner@example.test', id: 'owner', name: 'Owner', role: 'user' },
    { email: 'admin@example.test', id: 'admin', name: 'Admin', role: 'user' },
    { email: 'member@example.test', id: 'member', name: 'Member', role: 'user' },
    { email: 'global-admin@example.test', id: 'global-admin', name: 'Global', role: 'admin' },
];

const notFound = async () => new Response(null, { status: 404 });

describe('league routes', () => {
    let fixture: TestDatabase;
    let request: (method: string, path: string, email: string, body?: object) => Promise<Response>;

    beforeEach(async () => {
        fixture = await createTestDatabase();

        await fixture.db.insertInto('user').values(users)
            .execute();

        await fixture.db.insertInto('account').values(users.map(user => ({
            accountId: user.id,
            id: `account-${user.id}`,
            issuer: 'local:credential',
            password: passwordHash,
            providerId: 'credential',
            userId: user.id,
        })))
            .execute();

        await fixture.db.insertInto('organization').values({
            banLengthRounds: 3,
            id: 'grid-club',
            name: 'Grid Club',
            slug: 'grid-club',
            suspensionThresholdPoints: 12,
        })
            .execute();

        await fixture.db.insertInto('member').values(['owner', 'admin', 'member'].map(role => ({
            createdAt: new Date(),
            id: `member-${role}`,
            organizationId: 'grid-club',
            role,
            userId: role,
        })))
            .execute();

        const { app, auth } = createTestApp(fixture.db, notFound);

        request = async (method, path, email, body) => {
            const cookie = await signIn(auth, email);

            return app.request(path, {
                body: JSON.stringify(body),
                headers: { 'content-type': 'application/json', cookie },
                method,
            });
        };
    });

    afterEach(async () => {
        await fixture.destroy();
    });

    async function auditEntries() {
        return fixture.db
            .selectFrom('auditEntry')
            .select(['action', 'actorRole', 'actorUserId', 'targetType'])
            .execute();
    }

    describe('POST /api/organizations/:organizationId/leagues', () => {
        const path = '/api/organizations/grid-club/leagues';

        it.each(['owner', 'admin'])('lets an %s create a league and records it', async (role) => {
            const response = await request('POST', path, `${role}@example.test`, {
                name: 'Sunday Cup',
            });
            const body = await response.json();

            expect(response.status).toBe(201);
            expect(leagueSchema.parse(body)).toMatchObject({
                banLengthRounds: null,
                name: 'Sunday Cup',
                organizationId: 'grid-club',
                rulingSlaHours: 24,
            });
            expect(await auditEntries()).toEqual([{
                action: 'create',
                actorRole: role,
                actorUserId: role,
                targetType: 'league',
            }]);
        });

        it('responds 403 to a member and records nothing', async () => {
            const response = await request('POST', path, 'member@example.test', {
                name: 'Sunday Cup',
            });

            expect(response.status).toBe(403);
            expect(await auditEntries()).toEqual([]);
        });

        it('responds 404 to a global admin who is not a member', async () => {
            const response = await request('POST', path, 'global-admin@example.test', {
                name: 'Sunday Cup',
            });

            expect(response.status).toBe(404);
        });

        it('responds 400 with the issues for an invalid body', async () => {
            const response = await request('POST', path, 'owner@example.test', {
                name: '',
                rulingSlaHours: 0,
            });
            const body = await response.json();

            expect(response.status).toBe(400);
            expect(body).toEqual({
                error: 'Invalid request',
                issues: [
                    { message: expect.any(String), path: ['name'] },
                    { message: expect.any(String), path: ['rulingSlaHours'] },
                ],
            });
        });

        it('responds 409 to a duplicate name in the organization', async () => {
            await request('POST', path, 'owner@example.test', { name: 'Sunday Cup' });

            const response = await request('POST', path, 'owner@example.test', {
                name: 'Sunday Cup',
            });
            const body = await response.json();

            expect(response.status).toBe(409);
            expect(body).toEqual({ error: 'Conflict' });
        });
    });

    describe('GET /api/organizations/:organizationId/leagues', () => {
        const path = '/api/organizations/grid-club/leagues';

        it('lists the organization\'s leagues for a member', async () => {
            await request('POST', path, 'owner@example.test', { name: 'Sunday Cup' });

            const response = await request('GET', path, 'member@example.test');
            const body = await response.json();
            const { leagues } = leagueListSchema.parse(body);

            expect(response.status).toBe(200);
            expect(leagues.map(({ name }) => name)).toEqual(['Sunday Cup']);
        });

        it('responds 404 to a global admin who is not a member', async () => {
            const response = await request('GET', path, 'global-admin@example.test');

            expect(response.status).toBe(404);
        });
    });
});
