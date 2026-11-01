import { seasonListSchema, seasonSchema } from '@grid-governor/core/schemas';
import { createTestDatabase, type TestDatabase } from '@grid-governor/core/testing/database';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, seedOrganization, signIn } from '../../test/helpers.ts';

const notFound = async () => new Response(null, { status: 404 });

const seasonBody = {
    dropWorst: 0,
    expiryRounds: null,
    fastestLapBonus: 1,
    name: '2027',
    pointsScheme: [25, 18, 15],
    poleBonus: 0,
};

describe('season routes', () => {
    let fixture: TestDatabase;
    let leagueId: string;
    let seasonsPath: string;
    let request: (method: string, path: string, email: string, body?: object) => Promise<Response>;

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
                { leagueId, role: 'manager', userId: 'member' },
                { leagueId, role: 'steward', userId: 'driver' },
            ])
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

    async function insertSeason(name: string) {
        const { seasonId } = await fixture.db.insertInto('season')
            .values({ ...seasonBody, leagueId, name })
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
            .values({ carNumber: 7, driverId, seasonId })
            .returning('entryId')
            .executeTakeFirstOrThrow();

        const { roundId } = await fixture.db.insertInto('round')
            .values({ ordinal: 1, seasonId, track: 'Spa' })
            .returning('roundId')
            .executeTakeFirstOrThrow();

        await fixture.db.insertInto('result')
            .values({ entryId, roundId, seasonId })
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
        it('lists the seasons newest first, with whether each has results', async () => {
            const firstId = await insertSeason('2026');
            await insertSeason('2027');
            await addResult(firstId);

            const response = await request('GET', seasonsPath, 'driver@example.test');
            const body = await response.json();
            const { seasons } = seasonListSchema.parse(body);

            expect(response.status).toBe(200);
            expect(seasons.map(({ hasResults, name }) => ({ hasResults, name }))).toEqual([
                { hasResults: false, name: '2027' },
                { hasResults: true, name: '2026' },
            ]);
        });

        it('responds 404 to a user who is not a member', async () => {
            const response = await request('GET', seasonsPath, 'global-admin@example.test');

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/leagues/:leagueId/seasons', () => {
        it.each([
            ['owner', 'owner'],
            ['admin', 'admin'],
            ['member', 'manager'],
        ])('lets %s create a season as %s and records it', async (userId, role) => {
            const email = `${userId}@example.test`;
            const response = await request('POST', seasonsPath, email, seasonBody);
            const body = await response.json();

            expect(response.status).toBe(201);
            expect(seasonSchema.parse(body)).toMatchObject({
                ...seasonBody,
                hasResults: false,
                leagueId,
            });
            expect(await auditEntries()).toEqual([{
                action: 'create',
                actorRole: role,
                actorUserId: userId,
                targetType: 'season',
            }]);
        });

        it('responds 403 to a steward and records nothing', async () => {
            const response = await request('POST', seasonsPath, 'driver@example.test', seasonBody);

            expect(response.status).toBe(403);
            expect(await auditEntries()).toEqual([]);
        });

        it('responds 404 to a global admin who is not a member', async () => {
            const response = await request(
                'POST',
                seasonsPath,
                'global-admin@example.test',
                seasonBody,
            );

            expect(response.status).toBe(404);
        });

        it('responds 400 with the issues for an invalid body', async () => {
            const response = await request('POST', seasonsPath, 'owner@example.test', {
                ...seasonBody,
                expiryRounds: 0,
                pointsScheme: [],
            });
            const body = await response.json();

            expect(response.status).toBe(400);
            expect(body).toEqual({
                error: 'Invalid request',
                issues: [
                    { message: expect.any(String), path: ['expiryRounds'] },
                    { message: expect.any(String), path: ['pointsScheme'] },
                ],
            });
        });

        it('responds 409 to a duplicate name in the league', async () => {
            await insertSeason('2027');

            const response = await request('POST', seasonsPath, 'owner@example.test', seasonBody);

            expect(response.status).toBe(409);
        });
    });

    describe('GET /api/seasons/:seasonId', () => {
        it('returns the season to a member, with whether it has results', async () => {
            const seasonId = await insertSeason('2026');
            const path = `/api/seasons/${seasonId}`;
            await addResult(seasonId);

            const response = await request('GET', path, 'driver@example.test');
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

        it('responds 404 to a global admin who is not a member', async () => {
            const seasonId = await insertSeason('2026');
            const path = `/api/seasons/${seasonId}`;

            const response = await request('GET', path, 'global-admin@example.test');

            expect(response.status).toBe(404);
        });

        it.each(['/api/seasons/999', '/api/seasons/abc'])('responds 404 to %s', async (path) => {
            const response = await request('GET', path, 'owner@example.test');

            expect(response.status).toBe(404);
        });
    });

    describe('PUT /api/seasons/:seasonId', () => {
        const unchanged = { ...seasonBody, name: '2026' };

        it('lets a manager rename the season and records the change', async () => {
            const seasonId = await insertSeason('2026');
            const path = `/api/seasons/${seasonId}`;

            const response = await request('PUT', path, 'member@example.test', seasonBody);
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(seasonSchema.parse(body)).toMatchObject({ hasResults: false, name: '2027' });
            expect(await auditChanges()).toEqual([{
                action: 'update',
                actorRole: 'manager',
                changes: [{ field: 'name', from: '2026', to: '2027' }],
                targetType: 'season',
            }]);
        });

        it('changes the scoring before the season has results', async () => {
            const seasonId = await insertSeason('2026');
            const path = `/api/seasons/${seasonId}`;

            const response = await request('PUT', path, 'owner@example.test', {
                ...unchanged,
                pointsScheme: [10, 5],
            });
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(seasonSchema.parse(body)).toMatchObject({ pointsScheme: [10, 5] });
            expect(await auditChanges()).toEqual([{
                action: 'update',
                actorRole: 'owner',
                changes: [{ field: 'pointsScheme', from: [25, 18, 15], to: [10, 5] }],
                targetType: 'season',
            }]);
        });

        it('records nothing when no field changes', async () => {
            const seasonId = await insertSeason('2026');
            const path = `/api/seasons/${seasonId}`;

            const response = await request('PUT', path, 'owner@example.test', unchanged);

            expect(response.status).toBe(200);
            expect(await auditChanges()).toEqual([]);
        });

        it.each([
            ['dropWorst', 1],
            ['expiryRounds', 3],
            ['fastestLapBonus', 0],
            ['pointsScheme', [25, 18, 15, 12]],
            ['poleBonus', 1],
        ])('responds 409 to a change of %s once the season has results', async (field, value) => {
            const seasonId = await insertSeason('2026');
            const path = `/api/seasons/${seasonId}`;
            await addResult(seasonId);

            const response = await request('PUT', path, 'owner@example.test', {
                ...unchanged,
                [field]: value,
            });

            expect(response.status).toBe(409);
            expect(await auditChanges()).toEqual([]);
        });

        it('renames a season with results when the scoring is unchanged', async () => {
            const seasonId = await insertSeason('2026');
            const path = `/api/seasons/${seasonId}`;
            await addResult(seasonId);

            const response = await request('PUT', path, 'owner@example.test', seasonBody);
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(seasonSchema.parse(body)).toMatchObject({ hasResults: true, name: '2027' });
        });

        it('responds 403 to a steward on a season with results and records nothing', async () => {
            const seasonId = await insertSeason('2026');
            const path = `/api/seasons/${seasonId}`;
            await addResult(seasonId);

            const response = await request('PUT', path, 'driver@example.test', {
                ...unchanged,
                poleBonus: 1,
            });

            expect(response.status).toBe(403);
            expect(await auditChanges()).toEqual([]);
        });

        it('responds 404 to a global admin who is not a member', async () => {
            const seasonId = await insertSeason('2026');
            const path = `/api/seasons/${seasonId}`;

            const response = await request('PUT', path, 'global-admin@example.test', unchanged);

            expect(response.status).toBe(404);
        });
    });
});
