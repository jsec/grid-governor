import { createTestDatabase, type TestDatabase } from '@grid-governor/core/testing/database';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { requireMember, requirePermission } from './access.ts';

const users = [
    { email: 'owner@example.test', id: 'owner', name: 'Owner' },
    { email: 'admin@example.test', id: 'admin', name: 'Admin' },
    { email: 'member@example.test', id: 'member', name: 'Member' },
    { email: 'outsider@example.test', id: 'outsider', name: 'Outsider' },
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

        await fixture.db.insertInto('member').values(['owner', 'admin', 'member'].map(role => ({
            createdAt: new Date(),
            id: `member-${role}`,
            organizationId: 'grid-club',
            role,
            userId: role,
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
});
