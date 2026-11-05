import { leagueListSchema, leagueSchema } from '@grid-governor/core/schemas';
import { createTestDatabase, type TestDatabase } from '@grid-governor/core/testing/database';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, seedOrganization, signIn } from '../../test/helpers.ts';

type TestRequest = {
    body?: object;
    email: string;
    method: string;
    path: string;
};

describe('league routes', () => {
    let fixture: TestDatabase;
    let request: (options: TestRequest) => Promise<Response>;

    beforeEach(async () => {
        fixture = await createTestDatabase();

        await seedOrganization(fixture.db);

        const { app, auth } = createTestApp(fixture.db);

        request = async ({ body, email, method, path }) => {
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

    async function auditChanges() {
        return fixture.db
            .selectFrom('auditEntry')
            .select(['action', 'actorRole', 'changes'])
            .execute();
    }

    async function insertLeague() {
        const { leagueId } = await fixture.db
            .insertInto('league')
            .values({
                banLengthRounds: 2,
                name: 'Sunday Cup',
                organizationId: 'grid-club',
            })
            .returning('leagueId')
            .executeTakeFirstOrThrow();

        return `/api/leagues/${leagueId}`;
    }

    describe('POST /api/organizations/:organizationId/leagues', () => {
        const path = '/api/organizations/grid-club/leagues';

        it.each([
            'owner',
            'admin',
        ])('should let an %s create a league and record it', async (role) => {
            const response = await request({
                body: { name: 'Sunday Cup' },
                email: `${role}@example.test`,
                method: 'POST',
                path,
            });
            const body = await response.json();

            const entries = await auditEntries();

            expect(response.status).toBe(201);
            expect(leagueSchema.parse(body)).toMatchObject({
                banLengthRounds: null,
                name: 'Sunday Cup',
                organizationId: 'grid-club',
                rulingSlaHours: 24,
            });
            expect(entries).toEqual([{
                action: 'create',
                actorRole: role,
                actorUserId: role,
                targetType: 'league',
            }]);
        });

        it('should respond 403 to a member and record nothing', async () => {
            const response = await request({
                body: { name: 'Sunday Cup' },
                email: 'member@example.test',
                method: 'POST',
                path,
            });

            const entries = await auditEntries();

            expect(response.status).toBe(403);
            expect(entries).toEqual([]);
        });

        it('should respond 404 to a global admin who is not a member', async () => {
            const response = await request({
                body: { name: 'Sunday Cup' },
                email: 'global-admin@example.test',
                method: 'POST',
                path,
            });

            expect(response.status).toBe(404);
        });

        it('should respond 400 with the issues for an invalid body', async () => {
            const response = await request({
                body: {
                    name: '',
                    rulingSlaHours: 0,
                },
                email: 'owner@example.test',
                method: 'POST',
                path,
            });
            const body = await response.json();

            expect(response.status).toBe(400);
            expect(body).toMatchObject({
                error: 'Invalid request',
                issues: [
                    { path: ['name'] },
                    { path: ['rulingSlaHours'] },
                ],
            });
        });

        it('should respond 409 to a duplicate name in the organization', async () => {
            await request({
                body: { name: 'Sunday Cup' },
                email: 'owner@example.test',
                method: 'POST',
                path,
            });

            const response = await request({
                body: { name: 'Sunday Cup' },
                email: 'owner@example.test',
                method: 'POST',
                path,
            });
            const body = await response.json();

            expect(response.status).toBe(409);
            expect(body).toEqual({ error: 'Conflict' });
        });
    });

    describe('GET /api/organizations/:organizationId/leagues', () => {
        const path = '/api/organizations/grid-club/leagues';

        it('should list the organization\'s leagues for a member', async () => {
            await request({
                body: { name: 'Sunday Cup' },
                email: 'owner@example.test',
                method: 'POST',
                path,
            });

            const response = await request({
                email: 'member@example.test',
                method: 'GET',
                path,
            });
            const body = await response.json();
            const { leagues } = leagueListSchema.parse(body);

            expect(response.status).toBe(200);
            expect(leagues.map(({ name }) => name)).toEqual(['Sunday Cup']);
        });

        it('should respond 404 to a global admin who is not a member', async () => {
            const response = await request({
                email: 'global-admin@example.test',
                method: 'GET',
                path,
            });

            expect(response.status).toBe(404);
        });
    });

    describe('GET /api/leagues/:leagueId', () => {
        it('should return the league to a member', async () => {
            const path = await insertLeague();

            const response = await request({
                email: 'member@example.test',
                method: 'GET',
                path,
            });
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(leagueSchema.parse(body)).toMatchObject({
                name: 'Sunday Cup',
                organizationId: 'grid-club',
            });
        });

        it('should respond 404 to a global admin who is not a member', async () => {
            const path = await insertLeague();

            const response = await request({
                email: 'global-admin@example.test',
                method: 'GET',
                path,
            });

            expect(response.status).toBe(404);
        });

        it.each([
            '/api/leagues/999',
            '/api/leagues/abc',
        ])('should respond 404 to %s', async (path) => {
            const response = await request({
                email: 'member@example.test',
                method: 'GET',
                path,
            });

            expect(response.status).toBe(404);
        });
    });

    describe('PUT /api/leagues/:leagueId', () => {
        const unchanged = {
            banLengthRounds: 2,
            name: 'Sunday Cup',
            rulingSlaHours: 24,
            suspensionThresholdPoints: null,
        };

        it('should update the league and record each changed field', async () => {
            const path = await insertLeague();

            const response = await request({
                body: {
                    banLengthRounds: null,
                    name: 'Saturday Cup',
                    rulingSlaHours: 24,
                    suspensionThresholdPoints: null,
                },
                email: 'admin@example.test',
                method: 'PUT',
                path,
            });
            const body = await response.json();

            const changes = await auditChanges();

            expect(response.status).toBe(200);
            expect(leagueSchema.parse(body)).toMatchObject({
                banLengthRounds: null,
                name: 'Saturday Cup',
            });
            expect(changes).toEqual([{
                action: 'update',
                actorRole: 'admin',
                changes: [
                    {
                        field: 'banLengthRounds',
                        from: 2,
                        to: null,
                    },
                    {
                        field: 'name',
                        from: 'Sunday Cup',
                        to: 'Saturday Cup',
                    },
                ],
            }]);
        });

        it('should record nothing when no field changes', async () => {
            const path = await insertLeague();

            const response = await request({
                body: unchanged,
                email: 'owner@example.test',
                method: 'PUT',
                path,
            });

            const changes = await auditChanges();

            expect(response.status).toBe(200);
            expect(changes).toEqual([]);
        });

        it('should respond 403 to a member and record nothing', async () => {
            const path = await insertLeague();

            const response = await request({
                body: unchanged,
                email: 'member@example.test',
                method: 'PUT',
                path,
            });

            const changes = await auditChanges();

            expect(response.status).toBe(403);
            expect(changes).toEqual([]);
        });

        it('should respond 404 to a global admin who is not a member', async () => {
            const path = await insertLeague();

            const response = await request({
                body: unchanged,
                email: 'global-admin@example.test',
                method: 'PUT',
                path,
            });

            expect(response.status).toBe(404);
        });

        it('should respond 400 when a field is missing', async () => {
            const path = await insertLeague();

            const response = await request({
                body: { name: 'Saturday Cup' },
                email: 'owner@example.test',
                method: 'PUT',
                path,
            });

            expect(response.status).toBe(400);
        });
    });
});
