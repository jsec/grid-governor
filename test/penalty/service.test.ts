import {
  describe, expect, onTestFinished
} from 'vitest';

import {
  createPenalty, deletePenalty, getPenaltyById, updatePenalty
} from '../../src/modules/penalty/service.js';
import { ErrorCode } from '../../src/types/errors/app.error.js';
import { penaltyBuilder } from '../builders/penalty.builder.js';
import { test } from '../context.js';

describe('Penalty service', () => {
  test('should create a new penalty', async ({ db }) => {
    const newPenalty = penaltyBuilder.one();
    const result = await createPenalty(newPenalty);

    const penalty = result._unsafeUnwrap();

    expect(penalty.id).to.not.be.null;
    expect(penalty).toMatchObject({
      description: newPenalty.description,
      name: newPenalty.name
    });

    onTestFinished(async () => {
      await db
        .deleteFrom('penalties')
        .where('id', '=', penalty.id)
        .execute();
    });
  });

  test('should return an error when retrieving a penalty with an invalid id', async () => {
    const result = await getPenaltyById(999_999);

    const error = result._unsafeUnwrapErr();
    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.equal('no result');
  });

  test('should return a penalty by id', async ({ db }) => {
    const created = await createPenalty(penaltyBuilder.one());
    const penalty = created._unsafeUnwrap();

    const result = await getPenaltyById(penalty.id);
    expect(result._unsafeUnwrap()).toMatchObject(penalty);

    onTestFinished(async () => {
      await db
        .deleteFrom('penalties')
        .where('id', '=', penalty.id)
        .execute();
    });
  });

  test('should update a penalty name', async ({ db }) => {
    const existing = await createPenalty(penaltyBuilder.one());
    const penalty = existing._unsafeUnwrap();
    penalty.name = 'updated name';

    const result = await updatePenalty(penalty.id, penalty);
    const updatedPenalty = result._unsafeUnwrap();

    expect(updatedPenalty.name).to.equal(penalty.name);

    onTestFinished(async () => {
      await db
        .deleteFrom('penalties')
        .where('id', '=', penalty.id)
        .execute();
    });
  });

  test('should update a penalty description', async ({ db }) => {
    const existing = await createPenalty(penaltyBuilder.one());
    const penalty = existing._unsafeUnwrap();
    penalty.description = 'updated description';

    const result = await updatePenalty(penalty.id, penalty);
    const updatedPenalty = result._unsafeUnwrap();

    expect(updatedPenalty.description).to.equal(penalty.description);

    onTestFinished(async () => {
      await db
        .deleteFrom('penalties')
        .where('id', '=', penalty.id)
        .execute();
    });
  });

  test('should return an error when deleting a penalty with an invalid id', async () => {
    const result = await deletePenalty(999_999);
    const error = result._unsafeUnwrapErr();

    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.include('Penalty with id 999999 was not found');
  });

  test('should delete an existing penalty', async () => {
    const existing = await createPenalty(penaltyBuilder.one());
    const { id: penaltyId } = existing._unsafeUnwrap();

    const result = await deletePenalty(penaltyId);
    const { numDeletedRows } = result._unsafeUnwrap();
    expect(Number(numDeletedRows)).to.equal(1);
  });
});
