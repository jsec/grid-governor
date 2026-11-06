import {
    leagueMembershipListSchema,
    leagueMembershipSchema,
    leagueRolesSchema,
    leagueSchema,
    seasonListSchema,
    seasonSchema,
} from '@grid-governor/core/schemas';
import { createTestDatabase, type TestDatabase } from '@grid-governor/core/testing/database';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, seedOrganization, signIn } from '../../test/helpers.ts';

type TestRequest = {
    body?: object;
    email: string;
    method: string;
    path: string;
};

const seasonBody = {
    dropWorst: 0,
    expiryRounds: null,
    fastestLapBonus: 1,
    name: '2027',
    pointsScheme: [25, 18, 15],
    poleBonus: 0,
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

describe('league season routes', () => {
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
});

describe('league membership and role routes', () => {
    let fixture: TestDatabase;
    let leagueId: string;
    let membershipsPath: string;
    let request: (options: TestRequest) => Promise<Response>;

    beforeEach(async () => {
        fixture = await createTestDatabase();
        await seedOrganization(fixture.db);

        const league = await fixture.db.insertInto('league')
            .values({ name: 'Sunday Cup', organizationId: 'grid-club' })
            .returning('leagueId')
            .executeTakeFirstOrThrow();

        leagueId = league.leagueId;
        membershipsPath = `/api/leagues/${leagueId}/memberships`;

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

    async function grant(userId: string, role: string) {
        const { membershipId } = await fixture.db.insertInto('leagueMembership')
            .values({
                leagueId,
                role,
                userId,
            })
            .returning('membershipId')
            .executeTakeFirstOrThrow();

        return membershipId;
    }

    async function auditEntries() {
        return fixture.db
            .selectFrom('auditEntry')
            .select(['action', 'actorRole', 'actorUserId', 'targetType'])
            .execute();
    }

    describe('GET /api/leagues/:leagueId/memberships', () => {
        it('should list the active grants of current organization members', async () => {
            const stewardId = await grant('member', 'steward');
            const revokedId = await grant('driver', 'manager');
            await grant('global-admin', 'appeals');
            await fixture.db.updateTable('leagueMembership')
                .set({ revokedAt: new Date() })
                .where('membershipId', '=', revokedId)
                .execute();

            const response = await request({
                email: 'driver@example.test',
                method: 'GET',
                path: membershipsPath,
            });
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(leagueMembershipListSchema.parse(body).memberships).toMatchObject([
                {
                    id: stewardId,
                    role: 'steward',
                    userId: 'member',
                },
            ]);
        });

        it('should respond 404 to a user who is not a member', async () => {
            const response = await request({
                email: 'global-admin@example.test',
                method: 'GET',
                path: membershipsPath,
            });

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/leagues/:leagueId/memberships', () => {
        it.each(['owner', 'admin'])('should let an %s grant a role and record it', async (role) => {
            const response = await request({
                body: {
                    role: 'steward',
                    userId: 'member',
                },
                email: `${role}@example.test`,
                method: 'POST',
                path: membershipsPath,
            });
            const body = await response.json();

            const entries = await auditEntries();

            expect(response.status).toBe(201);
            expect(leagueMembershipSchema.parse(body)).toMatchObject({
                role: 'steward',
                userId: 'member',
            });
            expect(entries).toEqual([{
                action: 'grant',
                actorRole: role,
                actorUserId: role,
                targetType: 'league_membership',
            }]);
        });

        it('should respond 403 to a plain member and record nothing', async () => {
            const response = await request({
                body: {
                    role: 'steward',
                    userId: 'driver',
                },
                email: 'member@example.test',
                method: 'POST',
                path: membershipsPath,
            });

            const entries = await auditEntries();

            expect(response.status).toBe(403);
            expect(entries).toEqual([]);
        });

        it('should respond 404 to a global admin who is not a member', async () => {
            const response = await request({
                body: {
                    role: 'steward',
                    userId: 'member',
                },
                email: 'global-admin@example.test',
                method: 'POST',
                path: membershipsPath,
            });

            expect(response.status).toBe(404);
        });

        it.each([
            'admin',
            'global-admin',
        ])('should respond 400 to a grant for %s', async (userId) => {
            const response = await request({
                body: {
                    role: 'steward',
                    userId,
                },
                email: 'owner@example.test',
                method: 'POST',
                path: membershipsPath,
            });
            const body = await response.json();

            expect(response.status).toBe(400);
            expect(body).toEqual({
                error: 'Only organization members can hold league roles',
            });
        });

        it('should respond 400 to a role that does not exist', async () => {
            const response = await request({
                body: {
                    role: 'owner',
                    userId: 'member',
                },
                email: 'owner@example.test',
                method: 'POST',
                path: membershipsPath,
            });

            expect(response.status).toBe(400);
        });

        it('should respond 409 when the user already holds the role', async () => {
            await grant('member', 'steward');

            const response = await request({
                body: {
                    role: 'steward',
                    userId: 'member',
                },
                email: 'owner@example.test',
                method: 'POST',
                path: membershipsPath,
            });

            expect(response.status).toBe(409);
        });
    });

    describe('GET /api/leagues/:leagueId/roles', () => {
        it('should return a member\'s organization role and active league roles', async () => {
            await grant('member', 'steward');
            const revokedId = await grant('member', 'manager');
            await fixture.db.updateTable('leagueMembership')
                .set({ revokedAt: new Date() })
                .where('membershipId', '=', revokedId)
                .execute();

            const response = await request({
                email: 'member@example.test',
                method: 'GET',
                path: `/api/leagues/${leagueId}/roles`,
            });
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(leagueRolesSchema.parse(body)).toEqual({
                leagueRoles: ['steward'],
                organizationRole: 'member',
            });
        });

        it('should return an owner\'s organization role with no league roles', async () => {
            const response = await request({
                email: 'owner@example.test',
                method: 'GET',
                path: `/api/leagues/${leagueId}/roles`,
            });
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(leagueRolesSchema.parse(body)).toEqual({
                leagueRoles: [],
                organizationRole: 'owner',
            });
        });

        it('should respond 404 to a user who is not a member', async () => {
            const response = await request({
                email: 'global-admin@example.test',
                method: 'GET',
                path: `/api/leagues/${leagueId}/roles`,
            });

            expect(response.status).toBe(404);
        });

        it('should respond 404 for an unknown league', async () => {
            const response = await request({
                email: 'owner@example.test',
                method: 'GET',
                path: '/api/leagues/999/roles',
            });

            expect(response.status).toBe(404);
        });
    });
});
