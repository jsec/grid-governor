import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTestDatabase, type TestDatabase } from '../testing/database.ts';

describe('league_membership', () => {
    let fixture: TestDatabase;
    let leagueId: string;

    beforeEach(async () => {
        fixture = await createTestDatabase();

        await fixture.db.insertInto('user')
            .values({ email: 'member@example.test', id: 'member', name: 'Member' })
            .execute();

        await fixture.db.insertInto('organization')
            .values({
                banLengthRounds: 3,
                id: 'grid-club',
                name: 'Grid Club',
                slug: 'grid-club',
                suspensionThresholdPoints: 12,
            })
            .execute();

        const league = await fixture.db.insertInto('league')
            .values({ name: 'Sunday Cup', organizationId: 'grid-club' })
            .returning('leagueId')
            .executeTakeFirstOrThrow();

        leagueId = league.leagueId;
    });

    afterEach(async () => {
        await fixture.destroy();
    });

    it.each(['manager', 'steward', 'appeals'])('accepts the %s role', async (role) => {
        const insert = fixture.db.insertInto('leagueMembership')
            .values({ leagueId, role, userId: 'member' })
            .execute();

        await expect(insert).resolves.toBeDefined();
    });

    it('rejects any other role', async () => {
        const insert = fixture.db.insertInto('leagueMembership')
            .values({ leagueId, role: 'owner', userId: 'member' })
            .execute();

        await expect(insert).rejects.toThrow(/league_membership_role_check/);
    });
});
