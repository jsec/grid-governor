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
    let request: (options: TestRequest) => Promise<Response>;

    beforeEach(async () => {
        fixture = await createTestDatabase();
        await seedOrganization(fixture.db);

        const league = await fixture.db.insertInto('league')
            .values({ name: 'Sunday Cup', organizationId: 'grid-club' })
            .returning('leagueId')
            .executeTakeFirstOrThrow();

        leagueId = league.leagueId;

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
});
