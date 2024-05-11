import test from 'ava';
import { NoResultError } from 'kysely';

import { db } from '../../src/db/conn.js';
import {
  createPlatform,
  deletePlatform,
  getPlatformById,
  updatePlatform
} from '../../src/services/platform.service.js';

test('should create a new platform', async (t) => {
  const newPlatform = {
    name: 'iRenting'
  };

  const result = await createPlatform(newPlatform);

  t.like(result, {
    name: newPlatform.name
  });

  t.teardown(async () => {
    await db
      .deleteFrom('platforms')
      .where('id', '=', result.id)
      .execute();
  });
});

test('should return a platform by id', async (t) => {
  const existing = await createPlatform({
    name: 'Some Existing Platform'
  });

  const result = await getPlatformById(existing.id);

  t.like(result, existing);

  t.teardown(async () => {
    await db
      .deleteFrom('platforms')
      .where('id', '=', result.id)
      .execute();
  });
});

test('Get should return the correct error when a platform is not found by id', async (t) => {
  await t.throwsAsync(async () => {
    await getPlatformById(999_999);
  }, { instanceOf: NoResultError });
});

test('should update an existing platform', async (t) => {
  const existing = await createPlatform({
    name: 'Test Update'
  });

  const update = {
    name: 'Updated Platform Name'
  };

  const result = await updatePlatform(existing.id, update);

  t.like(result, {
    id: existing.id,
    name: update.name
  });

  t.teardown(async () => {
    await db
      .deleteFrom('platforms')
      .where('id', '=', existing.id)
      .execute();
  });
});

test('should delete an existing platform', async (t) => {
  const existing = await createPlatform({
    name: 'Platform Delete Test'
  });

  const result = await deletePlatform(existing.id);

  t.is(Number(result.numDeletedRows), 1);

  t.teardown(async () => {
    await db
      .deleteFrom('platforms')
      .where('id', '=', existing.id)
      .execute();
  });
});

test('Delete should return 0 rows deleted when the platform is not found by id', async (t) => {
  const result = await deletePlatform(999_999);

  t.is(Number(result.numDeletedRows), 0);
});

test.after.always('cleanup', async () => {
  await db.destroy();
});
