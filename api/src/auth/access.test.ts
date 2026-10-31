import { createTestDatabase, type TestDatabase } from '@grid-governor/core/testing/database';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { requireLeaguePermission, requireMember, requirePermission } from './access.ts';

const users = [
    { email: 'owner@example.test', id: 'owner', name: 'Owner' },
    { email: 'admin@example.test', id: 'admin', name: 'Admin' },
    { email: 'member@example.test', id: 'member', name: 'Member' },
    { email: 'outsider@example.test', id: 'outsider', name: 'Outsider' },
    { email: 'driver@example.test', id: 'driver', name: 'Driver' },
];

const members = [
    { role: 'owner', userId: 'owner' },
    { role: 'admin', userId: 'admin' },
    { role: 'member', userId: 'member' },
    { role: 'member', userId: 'driver' },
];

describe('organization access checks', () => {
    let fixture: TestDatabase;

    beforeEach(async () => {
        fixture = await createTestDatabase();

        await fixture.db.insertInto('user').values(users)
            .execute();

        await fixture.db.insertInto('organization').values({
            banLengthRounds: 3,
            id: 'grid-club',
            name: 'Grid Club',
            slug: 'grid-club',
            suspensionThresholdPoints: 12,
        })
            .execute();

        await fixture.db.insertInto('member').values(members.map(({ role, userId }) => ({
            createdAt: new Date(),
            id: `member-${userId}`,
            organizationId: 'grid-club',
            role,
            userId,
        })))
            .execute();
    });

    afterEach(async () => {
        await fixture.destroy();
    });

    it('returns the role of a member', async () => {
        const role = await requireMember(fixture.db, 'member', 'grid-club');

        expect(role).toBe('member');
    });

    it('responds 404 to a user who is not a member', async () => {
        const check = requireMember(fixture.db, 'outsider', 'grid-club');

        await expect(check).rejects.toMatchObject({ status: 404 });
    });

    it.each(['owner', 'admin'])('returns the %s role when it allows the action', async (role) => {
        const result = await requirePermission(fixture.db, role, 'grid-club', {
            league: ['create'],
        });

        expect(result).toBe(role);
    });

    it('responds 403 to a member without the permission', async () => {
        const check = requirePermission(fixture.db, 'member', 'grid-club', { league: ['create'] });

        await expect(check).rejects.toMatchObject({ status: 403 });
    });

    it('responds 404 to a permission check by a user who is not a member', async () => {
        const check = requirePermission(fixture.db, 'outsider', 'grid-club', {
            league: ['create'],
        });

        await expect(check).rejects.toMatchObject({ status: 404 });
    });

    describe('requireLeaguePermission', () => {
        let leagueId: string;

        beforeEach(async () => {
            const league = await fixture.db.insertInto('league')
                .values({ name: 'Sunday Cup', organizationId: 'grid-club' })
                .returning('leagueId')
                .executeTakeFirstOrThrow();

            leagueId = league.leagueId;

            await fixture.db.insertInto('leagueMembership')
                .values([
                    { leagueId, role: 'steward', userId: 'member' },
                    { leagueId, role: 'appeals', userId: 'member' },
                    { leagueId, revokedAt: new Date(), role: 'manager', userId: 'member' },
                    { leagueId, role: 'manager', userId: 'outsider' },
                ])
                .execute();
        });

        it.each(['owner', 'admin'])('returns the %s role without a league role', async (role) => {
            const result = await requireLeaguePermission(fixture.db, role, leagueId, {
                season: ['create'],
            });

            expect(result).toEqual({ organizationId: 'grid-club', role });
        });

        it.each([
            ['steward', { ruling: ['create'] }],
            ['appeals', { appeal: ['decide'] }],
        ] as const)('returns the %s role that allows the action', async (role, permissions) => {
            const result = await requireLeaguePermission(
                fixture.db,
                'member',
                leagueId,
                permissions,
            );

            expect(result).toEqual({ organizationId: 'grid-club', role });
        });

        it('responds 403 when only a revoked role allows the action', async () => {
            const check = requireLeaguePermission(fixture.db, 'member', leagueId, {
                season: ['create'],
            });

            await expect(check).rejects.toMatchObject({ status: 403 });
        });

        it('responds 403 to a member with no league role', async () => {
            const check = requireLeaguePermission(fixture.db, 'driver', leagueId, {
                ruling: ['create'],
            });

            await expect(check).rejects.toMatchObject({ status: 403 });
        });

        it('responds 404 to a user with a grant who is not a member', async () => {
            const check = requireLeaguePermission(fixture.db, 'outsider', leagueId, {
                season: ['create'],
            });

            await expect(check).rejects.toMatchObject({ status: 404 });
        });

        it('responds 404 for an unknown league', async () => {
            const check = requireLeaguePermission(fixture.db, 'owner', '999', {
                season: ['create'],
            });

            await expect(check).rejects.toMatchObject({ status: 404 });
        });
    });
});
