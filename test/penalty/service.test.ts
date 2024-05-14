import test from 'ava';
import { NoResultError } from 'kysely';

import { db } from '../../src/db/conn.js';
import {
  createPenalty, deletePenalty, getPenaltyById, updatePenalty
} from '../../src/modules/penalty/service.js';

test('should create a new penalty', async (t) => {
  const penalty = {
    description: 'New penalty',
    name: 'Penalty 1'
  };

  const result = await createPenalty(penalty);

  t.like(result, {
    description: penalty.description,
    name: penalty.name
  });

  t.teardown(async () => {
    await db
      .deleteFrom('penalties')
      .where('id', '=', result.id)
      .execute();
  });
});

test('should return a penalty by id', async (t) => {
  const penalty = await createPenalty({
    description: 'An existing penalty',
    name: 'Existing Penalty'
  });

  const result = await getPenaltyById(penalty.id);

  t.like(result, penalty);

  t.teardown(async () => {
    await db
      .deleteFrom('penalties')
      .where('id', '=', result.id)
      .execute();
  });
});

test('Get should return the correct error when a penalty is not found by id', async (t) => {
  await t.throwsAsync(async () => {
    await getPenaltyById(999_999);
  }, { instanceOf: NoResultError });
});

test('should update an existing penalty', async (t) => {
  const existing = await createPenalty({
    description: 'Existing penalty',
    name: 'Existing'
  });

  const update = {
    description: 'Existing penalty with updated description'
  };

  const result = await updatePenalty(existing.id, update);

  t.like(result, {
    description: update.description,
    id: existing.id,
    name: existing.name
  });

  t.teardown(async () => {
    await db
      .deleteFrom('penalties')
      .where('id', '=', existing.id)
      .execute();
  });
});

test('should delete an existing penalty', async (t) => {
  const existing = await createPenalty({
    description: 'Existing penalty',
    name: 'Existing'
  });

  const result = await deletePenalty(existing.id);

  t.is(Number(result.numDeletedRows), 1);

  t.teardown(async () => {
    await db
      .deleteFrom('penalties')
      .where('id', '=', existing.id)
      .execute();
  });
});

test('Delete should return 0 rows deleted when the penalty is not found by id', async (t) => {
  const result = await deletePenalty(999_999);

  t.is(Number(result.numDeletedRows), 0);
});

test.after.always('cleanup', async () => {
  await db.destroy();
});
