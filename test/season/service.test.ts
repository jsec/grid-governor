import { describe, expect } from 'vitest';

import {
  createSeason, deleteSeason, getSeasonById, updateSeason
} from '../../src/modules/season/service.js';
import { ErrorCode } from '../../src/types/errors/app.error.js';
import { PostgresErrorCode } from '../../src/types/errors/postgres.error.js';
import { seasonBuilder, seasonRecordBuilder } from '../builders/season.builder.js';
import { test } from '../context.js';

describe('Season service', () => {
  test('should return an error when the provided leagueId is invalid', async () => {
    const season = seasonBuilder.one();
    const result = await createSeason(season);

    const error = result._unsafeUnwrapErr();

    expect(error.code).to.equal(ErrorCode.DATABASE_ERROR);
    expect(error.name).to.equal(PostgresErrorCode.ForeignKeyViolation);
    expect(error.message).to.include('league_id');
  });

  test('should return an error when the provided platformId is invalid', async ({ league }) => {
    const season = seasonBuilder.one({
      overrides: {
        leagueId: league.id
      }
    });

    const result = await createSeason(season);

    const error = result._unsafeUnwrapErr();
    expect(error.code).to.equal(ErrorCode.DATABASE_ERROR);
    expect(error.name).to.equal(PostgresErrorCode.ForeignKeyViolation);
    expect(error.message).to.include('platform_id');
  });

  test('should create a new season', async ({
    db, league, platform
  }) => {
    const newSeason = seasonBuilder.one({
      overrides: {
        leagueId: league.id,
        platformId: platform.id
      }
    });

    const result = await createSeason(newSeason);
    const season = result._unsafeUnwrap();

    expect(season.id).to.not.be.null;
    expect(season).toMatchObject({
      leagueId: newSeason.leagueId,
      name: newSeason.name,
      platformId: newSeason.platformId,
    });

    await db
      .deleteFrom('seasons')
      .where('id', '=', season.id)
      .execute();
  });

  test('should return an error when retrieving a season with an invalid id', async () => {
    const result = await getSeasonById(999_999);

    const error = result._unsafeUnwrapErr();
    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.equal('no result');
  });

  test('should return a season by id', async ({
    db, league, platform
  }) => {
    const newSeason = seasonBuilder.one({
      overrides: {
        leagueId: league.id,
        platformId: platform.id
      }
    });

    const created = await createSeason(newSeason);
    const season = created._unsafeUnwrap();
    const result = await getSeasonById(season.id);

    expect(result._unsafeUnwrap()).toMatchObject(season);

    await db
      .deleteFrom('seasons')
      .where('id', '=', season.id)
      .execute();
  });

  test('should return an error when updating a season with an invalid id', async () => {
    const season = seasonRecordBuilder.one({
      overrides: {
        id: 999_999
      }
    });

    const result = await updateSeason(season.id, season);
    const error = result._unsafeUnwrapErr();

    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.equal('no result');
  });

  test("should update a season's name", async ({
    db, league, platform
  }) => {
    const newSeason = seasonBuilder.one({
      overrides: {
        leagueId: league.id,
        platformId: platform.id
      }
    });

    const created = await createSeason(newSeason);
    const existing = created._unsafeUnwrap();
    existing.name = 'Updated Name';

    // TODO: figure out how to handle the typing between Date/string conversions
    // Probably default to using timestamp strings, screw the date formatting
    const result = await updateSeason(existing.id, {
      ...existing,
      endDate: existing.endDate.toISOString(),
      startDate: existing.startDate.toISOString()
    });

    const season = result._unsafeUnwrap();
    expect(season.name).to.equal(existing.name);

    await db
      .deleteFrom('seasons')
      .where('id', '=', season.id)
      .execute();
  });

  test("should update a season's description", async ({
    db, league, platform
  }) => {
    const newSeason = seasonBuilder.one({
      overrides: {
        leagueId: league.id,
        platformId: platform.id
      }
    });

    const created = await createSeason(newSeason);
    const existing = created._unsafeUnwrap();
    existing.description = 'Updated Description';

    // TODO: figure out how to handle the typing between Date/string conversions
    // Probably default to using timestamp strings, screw the date formatting
    const result = await updateSeason(existing.id, {
      ...existing,
      endDate: existing.endDate.toISOString(),
      startDate: existing.startDate.toISOString()
    });

    const season = result._unsafeUnwrap();
    expect(season.description).to.equal(existing.description);

    await db
      .deleteFrom('seasons')
      .where('id', '=', season.id)
      .execute();
  });

  test('should return an error when deleting a season with an invalid id', async () => {
    const result = await deleteSeason(999_999);
    const error = result._unsafeUnwrapErr();

    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.name).to.equal('Not Found');
    expect(error.message).to.include('was not found');
  });

  test('should delete an existing season', async ({ league, platform }) => {
    const newSeason = seasonBuilder.one({
      overrides: {
        leagueId: league.id,
        platformId: platform.id
      }
    });

    const created = await createSeason(newSeason);
    const seasonId = created._unsafeUnwrap().id;

    const deleteResult = await deleteSeason(seasonId);
    const { numDeletedRows } = deleteResult._unsafeUnwrap();

    expect(Number(numDeletedRows)).to.equal(1);
  });
});
