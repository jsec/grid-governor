/* eslint-disable no-empty-pattern */
import { test as base } from 'vitest';

import type { Driver } from '../../src/modules/driver/types.js';
import type { League } from '../../src/modules/league/types.js';
import type { Platform } from '../../src/modules/platform/types.js';
import type { Race } from '../../src/modules/race/types.js';
import type { Season } from '../../src/modules/season/types.js';
import type { BaseContext } from './base.context.js';

import { createApp } from '../../src/app.js';
import { db } from '../../src/db/conn.js';
import { createDriver, deleteDriver } from '../../src/modules/driver/service.js';
import { createLeague, deleteLeague } from '../../src/modules/league/service.js';
import { createPlatform, deletePlatform } from '../../src/modules/platform/service.js';
import { createRace, deleteRace } from '../../src/modules/race/service.js';
import { createSeason, deleteSeason } from '../../src/modules/season/service.js';
import { driverBuilder } from '../builders/driver.builder.js';
import { leagueBuilder } from '../builders/league.builder.js';
import { platformBuilder } from '../builders/platform.builder.js';
import { raceBuilder } from '../builders/race.builder.js';
import { seasonBuilder } from '../builders/season.builder.js';

interface IncidentContext extends BaseContext {
  driver: Driver,
  league: League,
  platform: Platform,
  race: Race,
  reportingDriver: Driver,
  season: Season,
}

export const test = base.extend<IncidentContext>({
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
  race: async ({ league, season }, use) => {
    const raceResult = await createRace(raceBuilder.one({
      overrides: {
        leagueId: league.id,
        seasonId: season.id
      }
    }));

    const race = raceResult._unsafeUnwrap();

    await use(race);
    await deleteRace(race.id);
  },
  reportingDriver: async ({ }, use) => {
    const driver = await createDriver(driverBuilder.one());
    await use(driver);
    await deleteDriver(driver.id);
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