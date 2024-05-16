import { NoResultError } from 'kysely';
import {
  describe, expect, onTestFinished
} from 'vitest';

import {
  createLeague, deleteLeague, getLeagueById, updateLeague
} from '../../src/modules/league/service.js';
import { leagueBuilder } from '../builders/league.builder.js';
import { test } from '../context.js';

describe('League service', () => {
  test('should create a new league', async ({ db }) => {
    const league = leagueBuilder.one();
    const result = await createLeague(league);

    expect(result.id).to.not.be.null;
    expect(result.name).to.equal(league.name);
    expect(result.description).to.equal(league.description);

    onTestFinished(async () => {
      await db
        .deleteFrom('leagues')
        .where('id', '=', result.id)
        .execute();
    });
  });

  test('should return a league by id', async ({ db }) => {
    const existing = await createLeague(leagueBuilder.one());

    const result = await getLeagueById(existing.id);

    expect(result.id).to.equal(existing.id);
    expect(result.name).to.equal(existing.name);
    expect(result.description).to.equal(existing.description);

    onTestFinished(async () => {
      await db
        .deleteFrom('leagues')
        .where('id', '=', result.id)
        .execute();
    });
  });

  test('should return a NoResultError when a platform is not found by id', async () => {
    await expect(getLeagueById(999_999)).rejects.toThrow(NoResultError);
  });

  test('should update a league name', async ({ db }) => {
    const existing = await createLeague(leagueBuilder.one());
    existing.name = 'updated name';

    const result = await updateLeague(existing.id, existing);
    expect(result.name).to.equal(existing.name);

    onTestFinished(async () => {
      await db
        .deleteFrom('leagues')
        .where('id', '=', result.id)
        .execute();
    });
  });

  test('should update a league description', async ({ db }) => {
    const existing = await createLeague(leagueBuilder.one());
    existing.description = 'updated description';

    const result = await updateLeague(existing.id, existing);
    expect(result.name).to.equal(existing.name);

    onTestFinished(async () => {
      await db
        .deleteFrom('leagues')
        .where('id', '=', result.id)
        .execute();
    });
  });

  test('should delete an existing league', async () => {
    const existing = await createLeague(leagueBuilder.one());

    const result = await deleteLeague(existing.id);

    expect(Number(result.numDeletedRows)).to.equal(1);
  });

  test('should return 0 rows deleted when the league is not found by id', async () => {
    const result = await deleteLeague(999_999);

    expect(Number(result.numDeletedRows)).to.equal(0);
  });
});
