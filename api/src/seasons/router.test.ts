import { seasonListSchema, seasonSchema } from '@grid-governor/core/schemas';
import { createTestDatabase, type TestDatabase } from '@grid-governor/core/testing/database';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, seedOrganization, signIn } from '../../test/helpers.ts';

const seasonBody = {
    dropWorst: 0,
    expiryRounds: null,
    fastestLapBonus: 1,
    name: '2027',
    pointsScheme: [25, 18, 15],
    poleBonus: 0,
};

type TestRequest = {
    body?: object;
    email: string;
    method: string;
    path: string;
};

describe('season routes', () => {
    let fixture: TestDatabase;
    let leagueId: string;
    let seasonsPath: string;
    let request: (options: TestRequest) => Promise<Response>;

    beforeEach(async () => {
        fixture = await createTestDatabase();
        await seedOrganization(fixture.db);

        const league = await fixture.db.insertInto('league')
            .values({ name: 'Sunday Cup', organizationId: 'grid-club' })
            .returning('leagueId')
            .executeTakeFirstOrThrow();

        leagueId = league.leagueId;
        seasonsPath = `/api/leagues/${leagueId}/seasons`;

        await fixture.db.insertInto('leagueMembership')
            .values([
                {
                    leagueId,
                    role: 'manager',
                    userId: 'member',
                },
                {
                    leagueId,
                    role: 'steward',
                    userId: 'driver',
                },
            ])
            .execute();

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

    async function insertSeason(name: string) {
        const { seasonId } = await fixture.db.insertInto('season')
            .values({
                ...seasonBody,
                leagueId,
                name,
            })
            .returning('seasonId')
            .executeTakeFirstOrThrow();

        return seasonId;
    }

    async function addResult(seasonId: string) {
        const { driverId } = await fixture.db.insertInto('driver')
            .values({ displayName: 'Dee Driver', simId: 'sim-1' })
            .returning('driverId')
            .executeTakeFirstOrThrow();

        const { entryId } = await fixture.db.insertInto('entry')
            .values({
                carNumber: 7,
                driverId,
                seasonId,
            })
            .returning('entryId')
            .executeTakeFirstOrThrow();

        const { roundId } = await fixture.db.insertInto('round')
            .values({
                ordinal: 1,
                seasonId,
                track: 'Spa',
            })
            .returning('roundId')
            .executeTakeFirstOrThrow();

        await fixture.db.insertInto('result')
            .values({
                entryId,
                roundId,
                seasonId,
            })
            .execute();
    }

    async function auditEntries() {
        return fixture.db
            .selectFrom('auditEntry')
            .select(['action', 'actorRole', 'actorUserId', 'targetType'])
            .execute();
    }

    async function auditChanges() {
        return fixture.db
            .selectFrom('auditEntry')
            .select(['action', 'actorRole', 'changes', 'targetType'])
            .execute();
    }

    describe('GET /api/leagues/:leagueId/seasons', () => {
        it('should list the seasons newest first, with whether each has results', async () => {
            const firstId = await insertSeason('2026');
            await insertSeason('2027');
            await addResult(firstId);

            const response = await request({
                email: 'driver@example.test',
                method: 'GET',
                path: seasonsPath,
            });
            const body = await response.json();
            const { seasons } = seasonListSchema.parse(body);

            expect(response.status).toBe(200);
            expect(seasons.map(({ hasResults, name }) => ({ hasResults, name }))).toEqual([
                { hasResults: false, name: '2027' },
                { hasResults: true, name: '2026' },
            ]);
        });

        it('should respond 404 to a user who is not a member', async () => {
            const response = await request({
                email: 'global-admin@example.test',
                method: 'GET',
                path: seasonsPath,
            });

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/leagues/:leagueId/seasons', () => {
        it.each([
            ['owner', 'owner'],
            ['admin', 'admin'],
            ['member', 'manager'],
        ])('should let %s create a season as %s and record it', async (userId, role) => {
            const email = `${userId}@example.test`;
            const response = await request({
                body: seasonBody,
                email,
                method: 'POST',
                path: seasonsPath,
            });
            const body = await response.json();

            const entries = await auditEntries();

            expect(response.status).toBe(201);
            expect(seasonSchema.parse(body)).toMatchObject({
                ...seasonBody,
                hasResults: false,
                leagueId,
            });
            expect(entries).toEqual([{
                action: 'create',
                actorRole: role,
                actorUserId: userId,
                targetType: 'season',
            }]);
        });

        it('should respond 403 to a steward and record nothing', async () => {
            const response = await request({
                body: seasonBody,
                email: 'driver@example.test',
                method: 'POST',
                path: seasonsPath,
            });

            const entries = await auditEntries();

            expect(response.status).toBe(403);
            expect(entries).toEqual([]);
        });

        it('should respond 404 to a global admin who is not a member', async () => {
            const response = await request({
                body: seasonBody,
                email: 'global-admin@example.test',
                method: 'POST',
                path: seasonsPath,
            });

            expect(response.status).toBe(404);
        });

        it('should respond 400 with the issues for an invalid body', async () => {
            const response = await request({
                body: {
                    ...seasonBody,
                    expiryRounds: 0,
                    pointsScheme: [],
                },
                email: 'owner@example.test',
                method: 'POST',
                path: seasonsPath,
            });
            const body = await response.json();

            expect(response.status).toBe(400);
            expect(body).toMatchObject({
                error: 'Invalid request',
                issues: [
                    { path: ['expiryRounds'] },
                    { path: ['pointsScheme'] },
                ],
            });
        });

        it('should respond 409 to a duplicate name in the league', async () => {
            await insertSeason('2027');

            const response = await request({
                body: seasonBody,
                email: 'owner@example.test',
                method: 'POST',
                path: seasonsPath,
            });

            expect(response.status).toBe(409);
        });
    });

    describe('GET /api/seasons/:seasonId', () => {
        it('should return the season to a member, with whether it has results', async () => {
            const seasonId = await insertSeason('2026');
            const path = `/api/seasons/${seasonId}`;
            await addResult(seasonId);

            const response = await request({
                email: 'driver@example.test',
                method: 'GET',
                path,
            });
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(seasonSchema.parse(body)).toMatchObject({
                ...seasonBody,
                hasResults: true,
                id: seasonId,
                leagueId,
                name: '2026',
            });
        });

        it('should respond 404 to a global admin who is not a member', async () => {
            const seasonId = await insertSeason('2026');
            const path = `/api/seasons/${seasonId}`;

            const response = await request({
                email: 'global-admin@example.test',
                method: 'GET',
                path,
            });

            expect(response.status).toBe(404);
        });

        it.each([
            '/api/seasons/999',
            '/api/seasons/abc',
        ])('should respond 404 to %s', async (path) => {
            const response = await request({
                email: 'owner@example.test',
                method: 'GET',
                path,
            });

            expect(response.status).toBe(404);
        });
    });

    describe('PUT /api/seasons/:seasonId', () => {
        const unchanged = { ...seasonBody, name: '2026' };

        it('should let a manager rename the season and record the change', async () => {
            const seasonId = await insertSeason('2026');
            const path = `/api/seasons/${seasonId}`;

            const response = await request({
                body: seasonBody,
                email: 'member@example.test',
                method: 'PUT',
                path,
            });
            const body = await response.json();

            const changes = await auditChanges();

            expect(response.status).toBe(200);
            expect(seasonSchema.parse(body)).toMatchObject({ hasResults: false, name: '2027' });
            expect(changes).toEqual([{
                action: 'update',
                actorRole: 'manager',
                changes: [{
                    field: 'name',
                    from: '2026',
                    to: '2027',
                }],
                targetType: 'season',
            }]);
        });

        it('should change the scoring before the season has results', async () => {
            const seasonId = await insertSeason('2026');
            const path = `/api/seasons/${seasonId}`;

            const response = await request({
                body: {
                    ...unchanged,
                    pointsScheme: [10, 5],
                },
                email: 'owner@example.test',
                method: 'PUT',
                path,
            });
            const body = await response.json();

            const changes = await auditChanges();

            expect(response.status).toBe(200);
            expect(seasonSchema.parse(body)).toMatchObject({ pointsScheme: [10, 5] });
            expect(changes).toEqual([{
                action: 'update',
                actorRole: 'owner',
                changes: [{
                    field: 'pointsScheme',
                    from: [25, 18, 15],
                    to: [10, 5],
                }],
                targetType: 'season',
            }]);
        });

        it('should record nothing when no field changes', async () => {
            const seasonId = await insertSeason('2026');
            const path = `/api/seasons/${seasonId}`;

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

        it.each([
            ['dropWorst', 1],
            ['expiryRounds', 3],
            ['fastestLapBonus', 0],
            ['pointsScheme', [25, 18, 15, 12]],
            ['poleBonus', 1],
        ])('should respond 409 to a %s change on a scored season', async (field, value) => {
            const seasonId = await insertSeason('2026');
            const path = `/api/seasons/${seasonId}`;
            await addResult(seasonId);

            const response = await request({
                body: {
                    ...unchanged,
                    [field]: value,
                },
                email: 'owner@example.test',
                method: 'PUT',
                path,
            });

            const changes = await auditChanges();

            expect(response.status).toBe(409);
            expect(changes).toEqual([]);
        });

        it('should rename a season with results when the scoring is unchanged', async () => {
            const seasonId = await insertSeason('2026');
            const path = `/api/seasons/${seasonId}`;
            await addResult(seasonId);

            const response = await request({
                body: seasonBody,
                email: 'owner@example.test',
                method: 'PUT',
                path,
            });
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(seasonSchema.parse(body)).toMatchObject({ hasResults: true, name: '2027' });
        });

        it('should respond 403 to a steward on a scored season and record nothing', async () => {
            const seasonId = await insertSeason('2026');
            const path = `/api/seasons/${seasonId}`;
            await addResult(seasonId);

            const response = await request({
                body: {
                    ...unchanged,
                    poleBonus: 1,
                },
                email: 'driver@example.test',
                method: 'PUT',
                path,
            });

            const changes = await auditChanges();

            expect(response.status).toBe(403);
            expect(changes).toEqual([]);
        });

        it('should respond 404 to a global admin who is not a member', async () => {
            const seasonId = await insertSeason('2026');
            const path = `/api/seasons/${seasonId}`;

            const response = await request({
                body: unchanged,
                email: 'global-admin@example.test',
                method: 'PUT',
                path,
            });

            expect(response.status).toBe(404);
        });
    });
});
