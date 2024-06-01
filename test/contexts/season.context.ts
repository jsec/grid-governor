/* eslint-disable no-empty-pattern */
import { test as base } from 'vitest';

import type { League } from '../../src/modules/league/types.js';
import type { Platform } from '../../src/modules/platform/types.js';
import type { BaseContext } from './base.context.js';

import { createApp } from '../../src/app.js';
import { db } from '../../src/db/conn.js';
import { createLeague, deleteLeague } from '../../src/modules/league/service.js';
import { createPlatform, deletePlatform } from '../../src/modules/platform/service.js';
import { leagueBuilder } from '../builders/league.builder.js';
import { platformBuilder } from '../builders/platform.builder.js';

interface SeasonContext extends BaseContext {
  league: League,
  platform: Platform,
  seasonId?: number,
}

export const test = base.extend<SeasonContext>({
  app: createApp(),
  db: db,
  league: async ({ }, use) => {
    const leagueResult = await createLeague(leagueBuilder.one());
    const league = leagueResult._unsafeUnwrap();

    await use(league);
    await deleteLeague(league.id);
  },
  platform: async ({ }, use) => {
    const platform = await createPlatform(platformBuilder.one());

    await use(platform);

    await deletePlatform(platform.id);
  }
});
