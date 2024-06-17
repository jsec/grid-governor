import {
  describe, expect, onTestFinished
} from 'vitest';

import {
  createLeague, deleteLeague, getLeagueById, updateLeague
} from '../../src/modules/league/service.js';
import { ErrorCode } from '../../src/types/errors/app.error.js';
import { leagueBuilder, leagueRecordBuilder } from '../builders/league.builder.js';
import { test } from '../context.js';

describe('League service', () => {
  test('should create a new league', async ({ db }) => {
    const newLeague = leagueBuilder.one();
    const result = await createLeague(newLeague);

    const league = result._unsafeUnwrap();

    expect(league.id).to.not.be.null;
    expect(league).to.include({
      description: newLeague.description,
      name: newLeague.name
    });

    onTestFinished(async () => {
      await db
        .deleteFrom('leagues')
        .where('id', '=', league.id)
        .execute();
    });
  });

  test('should return an error when retrieving a league with an invalid id', async () => {
    const result = await getLeagueById(999_999);

    const error = result._unsafeUnwrapErr();
    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.equal('no result');
  });

  test('should return a league by id', async ({ db }) => {
    const created = await createLeague(leagueBuilder.one());
    const league = created._unsafeUnwrap();

    const result = await getLeagueById(league.id);
    expect(result._unsafeUnwrap()).to.include({
      description: league.description,
      id: league.id,
      name: league.name
    });

    onTestFinished(async () => {
      await db
        .deleteFrom('leagues')
        .where('id', '=', league.id)
        .execute();
    });
  });

  test('should return an error when updating a league with an invalid id', async () => {
    const league = leagueRecordBuilder.one({
      overrides: {
        id: 999_999
      }
    });

    const result = await updateLeague(league.id, league);
    const error = result._unsafeUnwrapErr();

    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.equal('no result');
  });

  test('should update a league name', async ({ db }) => {
    const existing = await createLeague(leagueBuilder.one());
    const league = existing._unsafeUnwrap();
    league.name = 'updated name';

    const result = await updateLeague(league.id, league);
    const updatedLeague = result._unsafeUnwrap();

    expect(updatedLeague.name).to.equal(league.name);

    onTestFinished(async () => {
      await db
        .deleteFrom('leagues')
        .where('id', '=', league.id)
        .execute();
    });
  });

  test('should update a league description', async ({ db }) => {
    const existing = await createLeague(leagueBuilder.one());
    const league = existing._unsafeUnwrap();
    league.description = 'updated description';

    const result = await updateLeague(league.id, league);
    const updatedLeague = result._unsafeUnwrap();

    expect(updatedLeague.description).to.equal(league.description);

    onTestFinished(async () => {
      await db
        .deleteFrom('leagues')
        .where('id', '=', league.id)
        .execute();
    });
  });

  test('should return an error when deleting a league with an invalid id', async () => {
    const result = await deleteLeague(999_999);
    const error = result._unsafeUnwrapErr();

    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.include('League with id 999999 was not found');
  });

  test('should delete an existing league', async () => {
    const existing = await createLeague(leagueBuilder.one());
    const { id: leagueId } = existing._unsafeUnwrap();

    const result = await deleteLeague(leagueId);
    const { status } = result._unsafeUnwrap();
    expect(status).to.equal('OK');
  });
});
