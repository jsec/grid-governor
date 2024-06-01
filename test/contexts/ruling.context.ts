/* eslint-disable no-empty-pattern */
import { test as base } from 'vitest';

import type { Race, Season } from '../../src/db/types.js';
import type { Driver } from '../../src/modules/driver/types.js';
import type { Incident } from '../../src/modules/incident/types.js';
import type { League } from '../../src/modules/league/types.js';
import type { Penalty } from '../../src/modules/penalty/types.js';
import type { Platform } from '../../src/modules/platform/types.js';
import type { BaseContext } from './base.context.js';

import { createApp } from '../../src/app.js';
import { db } from '../../src/db/conn.js';
import { createDriver, deleteDriver } from '../../src/modules/driver/service.js';
import { createIncident, deleteIncident } from '../../src/modules/incident/service.js';
import { createLeague, deleteLeague } from '../../src/modules/league/service.js';
import { createPenalty, deletePenalty } from '../../src/modules/penalty/service.js';
import { createPlatform, deletePlatform } from '../../src/modules/platform/service.js';
import { createRace, deleteRace } from '../../src/modules/race/service.js';
import { createSeason, deleteSeason } from '../../src/modules/season/service.js';
import { driverBuilder } from '../builders/driver.builder.js';
import { incidentBuilder } from '../builders/incident.builder.js';
import { leagueBuilder } from '../builders/league.builder.js';
import { penaltyBuilder } from '../builders/penalty.builder.js';
import { platformBuilder } from '../builders/platform.builder.js';
import { raceBuilder } from '../builders/race.builder.js';
import { seasonBuilder } from '../builders/season.builder.js';

interface RulingContext extends BaseContext {
  driver: Driver,
  incident: Incident,
  league: League,
  penalty: Penalty,
  platform: Platform,
  race: Race,
  reportingDriver: Driver,
  season: Season,
}

export const test = base.extend<RulingContext>({
  app: createApp(),
  db: db,
  driver: async ({ }, use) => {
    const driver = await createDriver(driverBuilder.one());
    await use(driver);
    await deleteDriver(driver.id);
  },
  incident: async ({
    driver, race, reportingDriver
  }, use) => {
    const incidentResult = await createIncident(incidentBuilder.one({
      overrides: {
        driverId: driver.id,
        raceId: race.id,
        reportingDriverId: reportingDriver.id
      }
    }));

    const incident = incidentResult._unsafeUnwrap();
    await use(incident);
    await deleteIncident(incident.id);
  },
  league: async ({ }, use) => {
    const league = await createLeague(leagueBuilder.one());
    await use(league);
    await deleteLeague(league.id);
  },
  penalty: async ({ }, use) => {
    const penalty = await createPenalty(penaltyBuilder.one());
    await use(penalty);
    await deletePenalty(penalty.id);
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
