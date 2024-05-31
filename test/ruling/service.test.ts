import { describe, expect } from 'vitest';

import {
  createRuling, deleteRuling, getRulingById, updateRuling
} from '../../src/modules/ruling/service.js';
import { ErrorCode } from '../../src/types/errors/app.error.js';
import { PostgresErrorCode } from '../../src/types/errors/postgres.error.js';
import { rulingBuilder, rulingRecordBuilder } from '../builders/ruling.builder.js';
import { test } from '../contexts/ruling.context.js';

describe('Ruling service', () => {
  test('should return an error when the provided incidentId is invalid',
    async ({ penalty }) => {
      const ruling = rulingBuilder.one({
        overrides: {
          penaltyId: penalty.id
        }
      });

      const result = await createRuling(ruling);
      const error = result._unsafeUnwrapErr();

      expect(error.code).to.equal(ErrorCode.DATABASE_ERROR);
      expect(error.name).to.equal(PostgresErrorCode.ForeignKeyViolation);
      expect(error.message).to.include('incident_id');
    });

  test('should return an error when the provided penaltyId is invalid',
    async ({ incident }) => {
      const ruling = rulingBuilder.one({
        overrides: {
          incidentId: incident.id
        }
      });

      const result = await createRuling(ruling);
      const error = result._unsafeUnwrapErr();

      expect(error.code).to.equal(ErrorCode.DATABASE_ERROR);
      expect(error.name).to.equal(PostgresErrorCode.ForeignKeyViolation);
      expect(error.message).to.include('penalty_id');
    });

  test('should create a new ruling', async ({
    db, incident, penalty
  }) => {
    const result = await createRuling(rulingBuilder.one({
      overrides: {
        incidentId: incident.id,
        penaltyId: penalty.id
      }
    }));

    const ruling = result._unsafeUnwrap();

    expect(ruling.id).to.not.be.null;
    expect(ruling).toMatchObject({
      incidentId: incident.id,
      penaltyId: penalty.id
    });

    await db
      .deleteFrom('rulings')
      .where('id', '=', ruling.id)
      .execute();
  });

  test('should return an error when retrieving a ruling with an invalid id', async () => {
    const result = await getRulingById(999_999);

    const error = result._unsafeUnwrapErr();
    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.equal('no result');
  });

  test('should return a ruling by id', async ({
    db, incident, penalty
  }) => {
    const created = await createRuling(rulingBuilder.one({
      overrides: {
        incidentId: incident.id,
        penaltyId: penalty.id
      }
    }));

    const ruling = created._unsafeUnwrap();

    const result = await getRulingById(ruling.id);
    expect(result._unsafeUnwrap()).toMatchObject(ruling);

    await db
      .deleteFrom('rulings')
      .where('id', '=', ruling.id)
      .execute();
  });

  test('should return an error when updating a ruling with an invalid id', async () => {
    const ruling = rulingRecordBuilder.one({
      overrides: {
        id: 999_999
      }
    });

    const result = await updateRuling(ruling.id, ruling);
    const error = result._unsafeUnwrapErr();

    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.equal('no result');
  });

  test('should return an error when deleting a ruling with an invalid id', async () => {
    const result = await deleteRuling(999_999);
    const error = result._unsafeUnwrapErr();

    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.include('Ruling with id 999999 was not found');
  });

  test('should delete an existing ruling', async ({ incident, penalty }) => {
    const existing = await createRuling(rulingBuilder.one({
      overrides: {
        incidentId: incident.id,
        penaltyId: penalty.id
      }
    }));

    const rulingId = existing._unsafeUnwrap().id;

    const deleteResult = await deleteRuling(rulingId);
    const { numDeletedRows } = deleteResult._unsafeUnwrap();

    expect(Number(numDeletedRows)).to.equal(1);
  });
});
