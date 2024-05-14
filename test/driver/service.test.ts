import test from 'ava';
import { NoResultError } from 'kysely';

import { db } from '../../src/db/conn.js';
import {
  createDriver, deleteDriver, getDriverById, updateDriver
} from '../../src/modules/driver/service.js';

test('should create a new driver', async (t) => {
  const newDriver = {
    discordId: 'cde',
    firstName: 'Bob',
    lastName: 'Jones',
    steamId: 'abc'
  };

  const result = await createDriver(newDriver);

  t.like(result, newDriver, 'Expecting response to match request shape');
  t.true(result.id !== null, 'Expecting a valid id');

  t.teardown(async () => {
    await db
      .deleteFrom('drivers')
      .where('id', '=', result.id)
      .execute();
  });
});

test('should return a driver by id', async (t) => {
  const existing = await createDriver({
    discordId: 'cde',
    firstName: 'Bob',
    lastName: 'Jones',
    steamId: 'abc'
  });

  const result = await getDriverById(existing.id);

  t.like(result, existing);

  t.teardown(async () => {
    await db
      .deleteFrom('drivers')
      .where('id', '=', result.id)
      .execute();
  });
});

test('Get should return the correct error when a league is not found by id', async (t) => {
  await t.throwsAsync(async () => {
    await getDriverById(999_999);
  }, { instanceOf: NoResultError });
});

test('should update an existing driver', async (t) => {
  const existing = await createDriver({
    discordId: 'cde',
    firstName: 'Bob',
    lastName: 'Jones',
    steamId: 'abc'
  });

  const result = await updateDriver(existing.id, {
    ...existing,
    lastName: 'Smith'
  });

  t.like(result, {
    ...existing,
    lastName: 'Smith'
  });

  t.teardown(async () => {
    await db
      .deleteFrom('drivers')
      .where('id', '=', existing.id)
      .execute();
  });
});

test('should delete an existing league', async (t) => {
  const existing = await createDriver({
    discordId: 'cde',
    firstName: 'Bob',
    lastName: 'Jones',
    steamId: 'abc'
  });

  const result = await deleteDriver(existing.id);

  t.is(Number(result.numDeletedRows), 1);

  t.teardown(async () => {
    await db
      .deleteFrom('drivers')
      .where('id', '=', existing.id)
      .execute();
  });
});

test('Delete should return 0 rows deleted when the league is not found by id', async (t) => {
  const result = await deleteDriver(999_999);

  t.is(Number(result.numDeletedRows), 0);
});

test.after.always('cleanup', async () => {
  await db.destroy();
});
