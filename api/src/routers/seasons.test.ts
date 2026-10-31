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
});
