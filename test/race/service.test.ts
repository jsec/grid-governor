import { describe, expect } from 'vitest';

import {
  createRace, deleteRace, getRaceById, updateRace
} from '../../src/modules/race/service.js';
import { ErrorCode } from '../../src/types/errors/app.error.js';
import { PostgresErrorCode } from '../../src/types/errors/postgres.error.js';
import { raceBuilder, raceRecordBuilder } from '../builders/race.builder.js';
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

  test('should return an error when the provided seasonId is invalid', async ({ league }) => {
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
  });

  test('should create a new race', async ({
    db, league, season
  }) => {
    const result = await createRace(raceBuilder.one({
      overrides: {
        leagueId: league.id,
        seasonId: season.id
      }
    }));

    const race = result._unsafeUnwrap();

    expect(race.id).to.not.be.null;
    expect(race).to.include({
      leagueId: league.id,
      seasonId: season.id
    });

    await db
      .deleteFrom('races')
      .where('id', '=', race.id)
      .execute();
  });

  test('should return an error when retrieving a race with an invalid id', async () => {
    const result = await getRaceById(999_999);

    const error = result._unsafeUnwrapErr();
    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.equal('no result');
  });

  test('should return a race by id', async ({
    db, league, season
  }) => {
    const created = await createRace(raceBuilder.one({
      overrides: {
        leagueId: league.id,
        seasonId: season.id
      }
    }));

    const race = created._unsafeUnwrap();

    const result = await getRaceById(race.id);
    expect(result._unsafeUnwrap()).to.include({
      id: race.id,
      leagueId: race.leagueId,
      name: race.name,
      seasonId: race.seasonId,
      week: race.week
    });

    await db
      .deleteFrom('races')
      .where('id', '=', race.id)
      .execute();
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
    const result = await deleteRace(999_999);
    const error = result._unsafeUnwrapErr();

    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.include('Race with id 999999 was not found');
  });

  test('should delete an existing race', async ({ league, season }) => {
    const created = await createRace(raceBuilder.one({
      overrides: {
        leagueId: league.id,
        seasonId: season.id
      }
    }));

    const race = created._unsafeUnwrap();

    const deleteResult = await deleteRace(race.id);
    const { status } = deleteResult._unsafeUnwrap();

    expect(status).to.equal('OK');
  });
});
