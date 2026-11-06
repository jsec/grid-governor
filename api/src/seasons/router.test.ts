import { roundListSchema, roundSchema, seasonSchema } from '@grid-governor/core/schemas';
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

const roundBody = {
    startsAt: null,
    track: 'Spa',
};

describe('season routes', () => {
    let fixture: TestDatabase;
    let leagueId: string;
    let request: (options: TestRequest) => Promise<Response>;

    beforeEach(async () => {
        fixture = await createTestDatabase();
        await seedOrganization(fixture.db);

        const league = await fixture.db.insertInto('league')
            .values({ name: 'Sunday Cup', organizationId: 'grid-club' })
            .returning('leagueId')
            .executeTakeFirstOrThrow();

        leagueId = league.leagueId;

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

    async function auditChanges() {
        return fixture.db
            .selectFrom('auditEntry')
            .select(['action', 'actorRole', 'changes', 'targetType'])
            .execute();
    }

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

describe('season round routes', () => {
    let fixture: TestDatabase;
    let seasonId: string;
    let roundsPath: string;
    let request: (options: TestRequest) => Promise<Response>;

    beforeEach(async () => {
        fixture = await createTestDatabase();
        await seedOrganization(fixture.db);

        const { leagueId } = await fixture.db.insertInto('league')
            .values({ name: 'Sunday Cup', organizationId: 'grid-club' })
            .returning('leagueId')
            .executeTakeFirstOrThrow();

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

        const season = await fixture.db.insertInto('season')
            .values({
                leagueId,
                name: '2026',
                pointsScheme: [25, 18, 15],
            })
            .returning('seasonId')
            .executeTakeFirstOrThrow();

        seasonId = season.seasonId;
        roundsPath = `/api/seasons/${seasonId}/rounds`;

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

    describe('GET /api/seasons/:seasonId/rounds', () => {
        it('should list the rounds to a member ordered by number', async () => {
            await fixture.db.insertInto('round')
                .values([
                    {
                        ordinal: 2,
                        seasonId,
                        track: 'Monza',
                    },
                    {
                        ordinal: 1,
                        seasonId,
                        track: 'Spa',
                    },
                ])
                .execute();

            const response = await request({
                email: 'driver@example.test',
                method: 'GET',
                path: roundsPath,
            });
            const body = await response.json();
            const { rounds } = roundListSchema.parse(body);

            expect(response.status).toBe(200);
            expect(rounds.map(({ ordinal, track }) => ({ ordinal, track }))).toEqual([
                { ordinal: 1, track: 'Spa' },
                { ordinal: 2, track: 'Monza' },
            ]);
        });

        it('should respond 404 to a global admin who is not a member', async () => {
            const response = await request({
                email: 'global-admin@example.test',
                method: 'GET',
                path: roundsPath,
            });

            expect(response.status).toBe(404);
        });

        it('should respond 404 for a season that does not exist', async () => {
            const response = await request({
                email: 'owner@example.test',
                method: 'GET',
                path: '/api/seasons/999/rounds',
            });

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/seasons/:seasonId/rounds', () => {
        it('should let a manager add rounds numbered in order and record each', async () => {
            const ordinals = [];

            for (const track of ['Spa', 'Monza', 'Spa']) {
                const response = await request({
                    body: { ...roundBody, track },
                    email: 'member@example.test',
                    method: 'POST',
                    path: roundsPath,
                });
                const body = await response.json();

                expect(response.status).toBe(201);
                ordinals.push(roundSchema.parse(body).ordinal);
            }

            const entries = await auditEntries();

            expect(ordinals).toEqual([1, 2, 3]);
            expect(entries).toHaveLength(3);
            expect(entries[0]).toEqual({
                action: 'create',
                actorRole: 'manager',
                actorUserId: 'member',
                targetType: 'round',
            });
        });

        it('should store a start time given with an offset and return it in UTC', async () => {
            const response = await request({
                body: { ...roundBody, startsAt: '2026-11-08T14:00:00+10:00' },
                email: 'owner@example.test',
                method: 'POST',
                path: roundsPath,
            });
            const body = await response.json();

            expect(response.status).toBe(201);
            expect(roundSchema.parse(body)).toMatchObject({
                ordinal: 1,
                seasonId,
                startsAt: '2026-11-08T04:00:00.000Z',
                track: 'Spa',
            });
        });

        it('should respond 403 to a steward and record nothing', async () => {
            const response = await request({
                body: roundBody,
                email: 'driver@example.test',
                method: 'POST',
                path: roundsPath,
            });

            const entries = await auditEntries();

            expect(response.status).toBe(403);
            expect(entries).toEqual([]);
        });

        it('should respond 404 to a global admin who is not a member', async () => {
            const response = await request({
                body: roundBody,
                email: 'global-admin@example.test',
                method: 'POST',
                path: roundsPath,
            });

            expect(response.status).toBe(404);
        });

        it('should respond 404 for a season that does not exist', async () => {
            const response = await request({
                body: roundBody,
                email: 'owner@example.test',
                method: 'POST',
                path: '/api/seasons/999/rounds',
            });

            expect(response.status).toBe(404);
        });

        it('should respond 400 to an empty track and a start time without an offset', async () => {
            const response = await request({
                body: { startsAt: '2026-11-08T14:00:00', track: ' ' },
                email: 'owner@example.test',
                method: 'POST',
                path: roundsPath,
            });
            const body = await response.json();

            expect(response.status).toBe(400);
            expect(body).toMatchObject({
                error: 'Invalid request',
                issues: [
                    { path: ['startsAt'] },
                    { path: ['track'] },
                ],
            });
        });
    });
});
