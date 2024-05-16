import { NoResultError } from 'kysely';
import {
  describe, expect, onTestFinished
} from 'vitest';

import {
  createPenalty, deletePenalty, getPenaltyById, updatePenalty
} from '../../src/modules/penalty/service.js';
import { penaltyBuilder } from '../builders/penalty.builder.js';
import { test } from '../context.js';

describe('Penalty service', () => {
  test('should create a new penalty', async ({ db }) => {
    const penalty = penaltyBuilder.one();
    const result = await createPenalty(penalty);

    expect(result.id).to.not.be.null;
    expect(result.name).to.equal(penalty.name);
    expect(result.description).to.equal(penalty.description);

    onTestFinished(async () => {
      await db
        .deleteFrom('penalties')
        .where('id', '=', result.id)
        .execute();
    });
  });

  test('should return a penalty by id', async ({ db }) => {
    const existing = await createPenalty(penaltyBuilder.one());

    const result = await getPenaltyById(existing.id);

    expect(result.id).to.equal(existing.id);
    expect(result.name).to.equal(existing.name);
    expect(result.description).to.equal(existing.description);

    onTestFinished(async () => {
      await db
        .deleteFrom('penalties')
        .where('id', '=', result.id)
        .execute();
    });
  });

  test('should return a NoResultError when a penalty is not found by id', async () => {
    await expect(getPenaltyById(999_999)).rejects.toThrow(NoResultError);
  });

  test('should update a penalty name', async ({ db }) => {
    const existing = await createPenalty(penaltyBuilder.one());
    existing.name = 'updated name';

    const result = await updatePenalty(existing.id, existing);
    expect(result.name).to.equal(existing.name);

    onTestFinished(async () => {
      await db
        .deleteFrom('penalties')
        .where('id', '=', result.id)
        .execute();
    });
  });

  test('should update a penalty description', async ({ db }) => {
    const existing = await createPenalty(penaltyBuilder.one());
    existing.description = 'updated description';

    const result = await updatePenalty(existing.id, existing);
    expect(result.name).to.equal(existing.name);

    onTestFinished(async () => {
      await db
        .deleteFrom('penalties')
        .where('id', '=', result.id)
        .execute();
    });
  });

  test('should delete an existing penalty', async () => {
    const existing = await createPenalty(penaltyBuilder.one());

    const result = await deletePenalty(existing.id);

    expect(Number(result.numDeletedRows)).to.equal(1);
  });

  test('should return 0 rows deleted when the penalty is not found by id', async () => {
    const result = await deletePenalty(999_999);

    expect(Number(result.numDeletedRows)).to.equal(0);
  });
});
