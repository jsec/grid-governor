import test from 'ava';
import { NoResultError } from 'kysely';

import { db } from '../../src/db/conn.js';
import {
  createLeague,
  deleteLeague,
  getLeagueById,
  updateLeague
} from '../../src/services/league.service.js';

test('Should create a new league', async (t) => {
  const newLeague = {
    description: 'New League',
    name: 'League 1'
  };

  const result = await createLeague(newLeague);

  t.like(result, {
    description: newLeague.description,
    name: newLeague.name
  });

  t.teardown(async () => {
    await db
      .deleteFrom('leagues')
      .where('id', '=', result.id)
      .execute();
  });
});

test('Should return a league by id', async (t) => {
  const existing = await createLeague({
    description: 'An existing league',
    name: 'Existing League'
  });

  const result = await getLeagueById(existing.id);

  t.like(result, existing);

  t.teardown(async () => {
    await db
      .deleteFrom('leagues')
      .where('id', '=', result.id)
      .execute();
  });
});

test('Get should return the correct error when a league is not found by id', async (t) => {
  await t.throwsAsync(async () => {
    await getLeagueById(999_999);
  }, { instanceOf: NoResultError });
});

test('Should update an existing league', async (t) => {
  const existing = await createLeague({
    description: 'Existing league',
    name: 'Existing'
  });

  const update = {
    description: 'Existing league with updated description'
  };

  const result = await updateLeague(existing.id, update);

  t.like(result, {
    description: update.description,
    id: existing.id,
    name: existing.name
  });

  t.teardown(async () => {
    await db
      .deleteFrom('leagues')
      .where('id', '=', existing.id)
      .execute();
  });
});

test('Should delete an existing league', async (t) => {
  const existing = await createLeague({
    description: 'Existing league',
    name: 'Existing'
  });

  const result = await deleteLeague(existing.id);

  t.is(Number(result.numDeletedRows), 1);

  t.teardown(async () => {
    await db
      .deleteFrom('leagues')
      .where('id', '=', existing.id)
      .execute();
  });
});

test('Delete should return 0 rows deleted when the league is not found by id', async (t) => {
  const result = await deleteLeague(999_999);

  t.is(Number(result.numDeletedRows), 0);
});

test.after.always('cleanup', async () => {
  await db.destroy();
});
