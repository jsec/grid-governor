import {
  describe, expect, onTestFinished
} from 'vitest';

import { createLeague } from '../../src/modules/league/service.js';
import { createPlatform } from '../../src/modules/platform/service.js';
import {
  createRace, deleteRace, getRaceById, updateRace
} from '../../src/modules/race/service.js';
import { createSeason } from '../../src/modules/season/service.js';
import { ErrorCode } from '../../src/types/errors/app.error.js';
import { PostgresErrorCode } from '../../src/types/errors/postgres.error.js';
import { leagueBuilder } from '../builders/league.builder.js';
import { platformBuilder } from '../builders/platform.builder.js';
import { raceBuilder, raceRecordBuilder } from '../builders/race.builder.js';
import { seasonBuilder } from '../builders/season.builder.js';
import { test } from '../context.js';

describe('Race service', () => {
  test('should return an error when the provided leagueId is invalid', async () => {
    const race = raceBuilder.one();
    const result = await createRace(race);

    const error = result._unsafeUnwrapErr();

    expect(error.code).to.equal(ErrorCode.DATABASE_ERROR);
    expect(error.name).to.equal(PostgresErrorCode.ForeignKeyViolation);
    expect(error.message).to.include('league_id');
  });

  test('should return an error when the provided seasonId is invalid', async ({ db }) => {
    const league = await createLeague(leagueBuilder.one());
    const race = raceBuilder.one({
      overrides: {
        leagueId: league.id
      }
    });

    const result = await createRace(race);
    const error = result._unsafeUnwrapErr();

    expect(error.code).to.equal(ErrorCode.DATABASE_ERROR);
    expect(error.name).to.equal(PostgresErrorCode.ForeignKeyViolation);
    expect(error.message).to.include('season_id');

    onTestFinished(async () => {
      await db
        .deleteFrom('leagues')
        .where('id', '=', league.id)
        .execute();
    });
  });

  test('should create a new race', async ({ db }) => {
    const league = await createLeague(leagueBuilder.one());
    const platform = await createPlatform(platformBuilder.one());
    const season = await createSeason(seasonBuilder.one({
      overrides: {
        leagueId: league.id,
        platformId: platform.id
      }
    }));

    const result = await createRace(raceBuilder.one({
      overrides: {
        leagueId: league.id,
        seasonId: season._unsafeUnwrap().id
      }
    }));

    const race = result._unsafeUnwrap();

    expect(race.id).to.not.be.null;
    expect(race).toMatchObject({
      leagueId: league.id,
      seasonId: season._unsafeUnwrap().id
    });

    onTestFinished(async () => {
      await db
        .deleteFrom('races')
        .where('id', '=', race.id)
        .execute();

      await db
        .deleteFrom('seasons')
        .where('id', '=', season._unsafeUnwrap().id)
        .execute();

      await db
        .deleteFrom('leagues')
        .where('id', '=', league.id)
        .execute();

      await db
        .deleteFrom('platforms')
        .where('id', '=', platform.id)
        .execute();
    });
  });

  test('should return an error when retrieving a race with an invalid id', async () => {
    const result = await getRaceById(999_999);

    const error = result._unsafeUnwrapErr();
    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.equal('no result');
  });

  test('should return a race by id', async ({ db }) => {
    const league = await createLeague(leagueBuilder.one());
    const platform = await createPlatform(platformBuilder.one());
    const season = await createSeason(seasonBuilder.one({
      overrides: {
        leagueId: league.id,
        platformId: platform.id
      }
    }));

    const created = await createRace(raceBuilder.one({
      overrides: {
        leagueId: league.id,
        seasonId: season._unsafeUnwrap().id
      }
    }));

    const race = created._unsafeUnwrap();

    const result = await getRaceById(race.id);
    expect(result._unsafeUnwrap()).toMatchObject(race);

    onTestFinished(async () => {
      await db
        .deleteFrom('races')
        .where('id', '=', race.id)
        .execute();

      await db
        .deleteFrom('seasons')
        .where('id', '=', season._unsafeUnwrap().id)
        .execute();

      await db
        .deleteFrom('leagues')
        .where('id', '=', league.id)
        .execute();

      await db
        .deleteFrom('platforms')
        .where('id', '=', platform.id)
        .execute();
    });
  });

  test('should return an error when updating a race with an invalid id', async () => {
    const race = raceRecordBuilder.one({
      overrides: {
        id: 999_999
      }
    });

    const result = await updateRace(race.id, race);
    const error = result._unsafeUnwrapErr();

    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.equal('no result');
  });

  test('should return an error when deleting a registration with an invalid id', async () => {
    const race = raceRecordBuilder.one({
      overrides: {
        id: 999_999
      }
    });

    const result = await deleteRace(race.id);
    const error = result._unsafeUnwrapErr();

    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.include('Race with id 999999 was not found');
  });

  test('should delete an existing race', async ({ db }) => {
    const league = await createLeague(leagueBuilder.one());
    const platform = await createPlatform(platformBuilder.one());
    const season = await createSeason(seasonBuilder.one({
      overrides: {
        leagueId: league.id,
        platformId: platform.id
      }
    }));

    const created = await createRace(raceBuilder.one({
      overrides: {
        leagueId: league.id,
        seasonId: season._unsafeUnwrap().id
      }
    }));

    const race = created._unsafeUnwrap();

    const deleteResult = await deleteRace(race.id);
    const { numDeletedRows } = deleteResult._unsafeUnwrap();

    expect(Number(numDeletedRows)).to.equal(1);

    onTestFinished(async () => {
      await db
        .deleteFrom('races')
        .where('id', '=', race.id)
        .execute();

      await db
        .deleteFrom('seasons')
        .where('id', '=', season._unsafeUnwrap().id)
        .execute();

      await db
        .deleteFrom('leagues')
        .where('id', '=', league.id)
        .execute();

      await db
        .deleteFrom('platforms')
        .where('id', '=', platform.id)
        .execute();
    });
  });
});
