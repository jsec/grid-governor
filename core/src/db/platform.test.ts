import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTestDatabase, type TestDatabase } from '../testing/database.ts';

describe('platform columns', () => {
    let fixture: TestDatabase;
    let seasonId: string;

    beforeEach(async () => {
        fixture = await createTestDatabase();

        await fixture.db.insertInto('organization')
            .values({
                banLengthRounds: 3,
                id: 'grid-club',
                name: 'Grid Club',
                slug: 'grid-club',
                suspensionThresholdPoints: 12,
            })
            .execute();

        const { leagueId } = await fixture.db.insertInto('league')
            .values({ name: 'Sunday Cup', organizationId: 'grid-club' })
            .returning('leagueId')
            .executeTakeFirstOrThrow();

        const season = await fixture.db.insertInto('season')
            .values({
                leagueId,
                name: '2026',
                platform: 'iracing',
                pointsScheme: [25, 18, 15],
            })
            .returning('seasonId')
            .executeTakeFirstOrThrow();

        seasonId = season.seasonId;
    });

    afterEach(async () => {
        await fixture.destroy();
    });

    async function insertDriver(platform: string, simId: string) {
        const { driverId } = await fixture.db.insertInto('driver')
            .values({
                displayName: 'Dee Driver',
                platform,
                simId,
            })
            .returning('driverId')
            .executeTakeFirstOrThrow();

        return driverId;
    }

    it('should reject an unknown platform', async () => {
        const insert = insertDriver('gt7', 'sim-1');

        await expect(insert).rejects.toThrow(/driver_platform_check/);
    });

    it('should allow one sim ID on two platforms', async () => {
        await insertDriver('iracing', 'sim-1');
        await insertDriver('acc', 'sim-1');

        const drivers = await fixture.db.selectFrom('driver')
            .select('platform')
            .orderBy('platform')
            .execute();

        expect(drivers).toEqual([{ platform: 'acc' }, { platform: 'iracing' }]);
    });

    it('should reject a sim ID repeated on the same platform', async () => {
        await insertDriver('iracing', 'sim-1');

        const insert = insertDriver('iracing', 'sim-1');

        await expect(insert).rejects.toThrow(/driver_platform_sim_id_key/);
    });

    it('should reject an entry whose driver is on another platform', async () => {
        const driverId = await insertDriver('acc', 'sim-1');

        const insert = fixture.db.insertInto('entry')
            .values({
                carNumber: 7,
                driverId,
                platform: 'iracing',
                seasonId,
            })
            .execute();

        await expect(insert).rejects.toThrow(/entry_driver_id_platform_fkey/);
    });

    it('should reject an entry on another platform than its season', async () => {
        const driverId = await insertDriver('acc', 'sim-1');

        const insert = fixture.db.insertInto('entry')
            .values({
                carNumber: 7,
                driverId,
                platform: 'acc',
                seasonId,
            })
            .execute();

        await expect(insert).rejects.toThrow(/entry_season_id_platform_fkey/);
    });
});
