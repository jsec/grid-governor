import {
    leagueMembershipListSchema,
    leagueMembershipSchema,
    leagueRolesSchema,
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

describe('league membership routes', () => {
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

    describe('DELETE /api/league-memberships/:membershipId', () => {
        it('should revoke the grant and record it', async () => {
            const membershipId = await grant('member', 'steward');

            const response = await request({
                email: 'admin@example.test',
                method: 'DELETE',
                path: `/api/league-memberships/${membershipId}`,
            });
            const membership = await fixture.db.selectFrom('leagueMembership')
                .select('revokedAt')
                .where('membershipId', '=', membershipId)
                .executeTakeFirstOrThrow();

            const entries = await auditEntries();

            expect(response.status).toBe(204);
            expect(membership.revokedAt).toBeInstanceOf(Date);
            expect(entries).toEqual([{
                action: 'revoke',
                actorRole: 'admin',
                actorUserId: 'admin',
                targetType: 'league_membership',
            }]);
        });

        it('should respond 403 to a plain member', async () => {
            const membershipId = await grant('member', 'steward');

            const response = await request({
                email: 'driver@example.test',
                method: 'DELETE',
                path: `/api/league-memberships/${membershipId}`,
            });

            expect(response.status).toBe(403);
        });

        it('should respond 404 to a grant that is already revoked', async () => {
            const membershipId = await grant('member', 'steward');
            const path = `/api/league-memberships/${membershipId}`;
            await request({
                email: 'owner@example.test',
                method: 'DELETE',
                path,
            });

            const response = await request({
                email: 'owner@example.test',
                method: 'DELETE',
                path,
            });

            expect(response.status).toBe(404);
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
