import { createTestDatabase, type TestDatabase } from '@grid-governor/core/testing/database';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { requireLeaguePermission, requireMember, requirePermission } from './access.ts';

const users = [
    {
        email: 'owner@example.test',
        id: 'owner',
        name: 'Owner',
    },
    {
        email: 'admin@example.test',
        id: 'admin',
        name: 'Admin',
    },
    {
        email: 'member@example.test',
        id: 'member',
        name: 'Member',
    },
    {
        email: 'outsider@example.test',
        id: 'outsider',
        name: 'Outsider',
    },
    {
        email: 'driver@example.test',
        id: 'driver',
        name: 'Driver',
    },
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

    it('should return the role of a member', async () => {
        const role = await requireMember(fixture.db, 'member', 'grid-club');

        expect(role).toBe('member');
    });

    it('should respond 404 to a user who is not a member', async () => {
        const check = requireMember(fixture.db, 'outsider', 'grid-club');

        await expect(check).rejects.toMatchObject({ status: 404 });
    });

    it.each([
        'owner',
        'admin',
    ])('should return the %s role when it allows the action', async (role) => {
        const result = await requirePermission({
            db: fixture.db,
            organizationId: 'grid-club',
            permissions: { league: ['create'] },
            userId: role,
        });

        expect(result).toBe(role);
    });

    it('should respond 403 to a member without the permission', async () => {
        const check = requirePermission({
            db: fixture.db,
            organizationId: 'grid-club',
            permissions: { league: ['create'] },
            userId: 'member',
        });

        await expect(check).rejects.toMatchObject({ status: 403 });
    });

    it('should respond 404 to a permission check by a user who is not a member', async () => {
        const check = requirePermission({
            db: fixture.db,
            organizationId: 'grid-club',
            permissions: { league: ['create'] },
            userId: 'outsider',
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
                    {
                        leagueId,
                        role: 'steward',
                        userId: 'member',
                    },
                    {
                        leagueId,
                        role: 'appeals',
                        userId: 'member',
                    },
                    {
                        leagueId,
                        revokedAt: new Date(),
                        role: 'manager',
                        userId: 'member',
                    },
                    {
                        leagueId,
                        role: 'manager',
                        userId: 'outsider',
                    },
                ])
                .execute();
        });

        it.each([
            'owner',
            'admin',
        ])('should return the actor with the %s role and no league role', async (role) => {
            const result = await requireLeaguePermission({
                db: fixture.db,
                leagueId,
                permissions: { season: ['create'] },
                userId: role,
            });

            expect(result).toEqual({
                leagueId,
                organizationId: 'grid-club',
                role,
                userId: role,
            });
        });

        it.each([
            ['steward', { ruling: ['create'] }],
            ['appeals', { appeal: ['decide'] }],
        ] as const)('should return the actor as %s for the action', async (role, permissions) => {
            const result = await requireLeaguePermission({
                db: fixture.db,
                leagueId,
                permissions,
                userId: 'member',
            });

            expect(result).toEqual({
                leagueId,
                organizationId: 'grid-club',
                role,
                userId: 'member',
            });
        });

        it('should respond 403 when only a revoked role allows the action', async () => {
            const check = requireLeaguePermission({
                db: fixture.db,
                leagueId,
                permissions: { season: ['create'] },
                userId: 'member',
            });

            await expect(check).rejects.toMatchObject({ status: 403 });
        });

        it('should respond 403 to a member with no league role', async () => {
            const check = requireLeaguePermission({
                db: fixture.db,
                leagueId,
                permissions: { ruling: ['create'] },
                userId: 'driver',
            });

            await expect(check).rejects.toMatchObject({ status: 403 });
        });

        it('should respond 404 to a user with a grant who is not a member', async () => {
            const check = requireLeaguePermission({
                db: fixture.db,
                leagueId,
                permissions: { season: ['create'] },
                userId: 'outsider',
            });

            await expect(check).rejects.toMatchObject({ status: 404 });
        });

        it('should respond 404 for an unknown league', async () => {
            const check = requireLeaguePermission({
                db: fixture.db,
                leagueId: '999',
                permissions: { season: ['create'] },
                userId: 'owner',
            });

            await expect(check).rejects.toMatchObject({ status: 404 });
        });
    });
});
