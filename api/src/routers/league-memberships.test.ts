import { leagueMembershipListSchema, leagueMembershipSchema } from '@grid-governor/core/schemas';
import { createTestDatabase, type TestDatabase } from '@grid-governor/core/testing/database';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, seedOrganization, signIn } from '../../test/helpers.ts';

const notFound = async () => new Response(null, { status: 404 });

describe('league membership routes', () => {
    let fixture: TestDatabase;
    let leagueId: string;
    let membershipsPath: string;
    let request: (method: string, path: string, email: string, body?: object) => Promise<Response>;

    beforeEach(async () => {
        fixture = await createTestDatabase();
        await seedOrganization(fixture.db);

        const league = await fixture.db.insertInto('league')
            .values({ name: 'Sunday Cup', organizationId: 'grid-club' })
            .returning('leagueId')
            .executeTakeFirstOrThrow();

        leagueId = league.leagueId;
        membershipsPath = `/api/leagues/${leagueId}/memberships`;

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

    async function grant(userId: string, role: string) {
        const { membershipId } = await fixture.db.insertInto('leagueMembership')
            .values({ leagueId, role, userId })
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
        it('lists the active grants of current organization members', async () => {
            const stewardId = await grant('member', 'steward');
            const revokedId = await grant('driver', 'manager');
            await grant('global-admin', 'appeals');
            await fixture.db.updateTable('leagueMembership')
                .set({ revokedAt: new Date() })
                .where('membershipId', '=', revokedId)
                .execute();

            const response = await request('GET', membershipsPath, 'driver@example.test');
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(leagueMembershipListSchema.parse(body).memberships).toEqual([
                expect.objectContaining({ id: stewardId, role: 'steward', userId: 'member' }),
            ]);
        });

        it('responds 404 to a user who is not a member', async () => {
            const response = await request('GET', membershipsPath, 'global-admin@example.test');

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/leagues/:leagueId/memberships', () => {
        it.each(['owner', 'admin'])('lets an %s grant a role and records it', async (role) => {
            const response = await request('POST', membershipsPath, `${role}@example.test`, {
                role: 'steward',
                userId: 'member',
            });
            const body = await response.json();

            expect(response.status).toBe(201);
            expect(leagueMembershipSchema.parse(body)).toMatchObject({
                role: 'steward',
                userId: 'member',
            });
            expect(await auditEntries()).toEqual([{
                action: 'grant',
                actorRole: role,
                actorUserId: role,
                targetType: 'league_membership',
            }]);
        });

        it('responds 403 to a plain member and records nothing', async () => {
            const response = await request('POST', membershipsPath, 'member@example.test', {
                role: 'steward',
                userId: 'driver',
            });

            expect(response.status).toBe(403);
            expect(await auditEntries()).toEqual([]);
        });

        it('responds 404 to a global admin who is not a member', async () => {
            const response = await request('POST', membershipsPath, 'global-admin@example.test', {
                role: 'steward',
                userId: 'member',
            });

            expect(response.status).toBe(404);
        });

        it.each(['admin', 'global-admin'])('responds 400 to a grant for %s', async (userId) => {
            const response = await request('POST', membershipsPath, 'owner@example.test', {
                role: 'steward',
                userId,
            });
            const body = await response.json();

            expect(response.status).toBe(400);
            expect(body).toEqual({
                error: 'Only organization members can hold league roles',
            });
        });

        it('responds 400 to a role that does not exist', async () => {
            const response = await request('POST', membershipsPath, 'owner@example.test', {
                role: 'owner',
                userId: 'member',
            });

            expect(response.status).toBe(400);
        });

        it('responds 409 when the user already holds the role', async () => {
            await grant('member', 'steward');

            const response = await request('POST', membershipsPath, 'owner@example.test', {
                role: 'steward',
                userId: 'member',
            });

            expect(response.status).toBe(409);
        });
    });

    describe('DELETE /api/league-memberships/:membershipId', () => {
        it('revokes the grant and records it', async () => {
            const membershipId = await grant('member', 'steward');

            const response = await request(
                'DELETE',
                `/api/league-memberships/${membershipId}`,
                'admin@example.test',
            );
            const membership = await fixture.db.selectFrom('leagueMembership')
                .select('revokedAt')
                .where('membershipId', '=', membershipId)
                .executeTakeFirstOrThrow();

            expect(response.status).toBe(204);
            expect(membership.revokedAt).toBeInstanceOf(Date);
            expect(await auditEntries()).toEqual([{
                action: 'revoke',
                actorRole: 'admin',
                actorUserId: 'admin',
                targetType: 'league_membership',
            }]);
        });

        it('responds 403 to a plain member', async () => {
            const membershipId = await grant('member', 'steward');

            const response = await request(
                'DELETE',
                `/api/league-memberships/${membershipId}`,
                'driver@example.test',
            );

            expect(response.status).toBe(403);
        });

        it('responds 404 to a grant that is already revoked', async () => {
            const membershipId = await grant('member', 'steward');
            const path = `/api/league-memberships/${membershipId}`;
            await request('DELETE', path, 'owner@example.test');

            const response = await request('DELETE', path, 'owner@example.test');

            expect(response.status).toBe(404);
        });
    });
});
