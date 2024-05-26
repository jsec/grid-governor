/* eslint-disable no-empty-pattern */
import { test as base } from 'vitest';

import type { League } from '../../src/db/schema/league.schema.js';
import type { Platform } from '../../src/db/schema/platform.schema.js';
import type { Season } from '../../src/db/schema/season.schema.js';
import type { Driver } from '../../src/modules/driver/types.js';
import type { BaseContext } from './base.context.js';

import { createApp } from '../../src/app.js';
import { db } from '../../src/db/conn.js';
import { createDriver, deleteDriver } from '../../src/modules/driver/service.js';
import { createLeague, deleteLeague } from '../../src/modules/league/service.js';
import { createPlatform, deletePlatform } from '../../src/modules/platform/service.js';
import { createSeason, deleteSeason } from '../../src/modules/season/service.js';
import { driverBuilder } from '../builders/driver.builder.js';
import { leagueBuilder } from '../builders/league.builder.js';
import { platformBuilder } from '../builders/platform.builder.js';
import { seasonBuilder } from '../builders/season.builder.js';

interface RegistrationContext extends BaseContext {
  driver: Driver,
  league: League,
  platform: Platform,
  season: Season,
}

export const test = base.extend<RegistrationContext>({
  app: createApp(),
  db: db,
  driver: async ({ }, use) => {
    const driver = await createDriver(driverBuilder.one());
    await use(driver);
    await deleteDriver(driver.id);
  },
  league: async ({ }, use) => {
    const league = await createLeague(leagueBuilder.one());
    await use(league);
    await deleteLeague(league.id);
  },
  platform: async ({ }, use) => {
    const platform = await createPlatform(platformBuilder.one());
    await use(platform);
    await deletePlatform(platform.id);
  },
  season: async ({ league, platform }, use) => {
    const seasonResult = await createSeason(seasonBuilder.one({
      overrides: {
        leagueId: league.id,
        platformId: platform.id
      }
    }));

    const season = seasonResult._unsafeUnwrap();

    await use(season);
    await deleteSeason(season.id);
  }
});
