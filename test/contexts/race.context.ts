/* eslint-disable no-empty-pattern */
import { test as base } from 'vitest';

import type { Season } from '../../src/db/schema/season.schema.js';
import type { League } from '../../src/modules/league/types.js';
import type { Platform } from '../../src/modules/platform/types.js';
import type { BaseContext } from './base.context.js';

import { createApp } from '../../src/app.js';
import { db } from '../../src/db/conn.js';
import { createLeague, deleteLeague } from '../../src/modules/league/service.js';
import { createPlatform, deletePlatform } from '../../src/modules/platform/service.js';
import { createSeason, deleteSeason } from '../../src/modules/season/service.js';
import { leagueBuilder } from '../builders/league.builder.js';
import { platformBuilder } from '../builders/platform.builder.js';
import { seasonBuilder } from '../builders/season.builder.js';

interface RaceContext extends BaseContext {
  league: League,
  platform: Platform,
  season: Season,
}

export const test = base.extend<RaceContext>({
  app: createApp(),
  db: db,
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
