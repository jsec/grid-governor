import { describe, expect } from 'vitest';

import {
  createRegistration, deleteRegistration, getRegistrationById, updateRegistration
} from '../../src/modules/registration/service.js';
import { ErrorCode } from '../../src/types/errors/app.error.js';
import { PostgresErrorCode } from '../../src/types/errors/postgres.error.js';
import {
  registrationBuilder,
  registrationRecordBuilder
} from '../builders/registration.builder.js';
import { test } from '../context.js';

describe('Registration service', () => {
  test('should return an error when the provided driverId is invalid', async () => {
    const registration = registrationBuilder.one();
    const result = await createRegistration(registration);

    const error = result._unsafeUnwrapErr();

    expect(error.code).to.equal(ErrorCode.DATABASE_ERROR);
    expect(error.name).to.equal(PostgresErrorCode.ForeignKeyViolation);
    expect(error.message).to.include('driver_id');
  });

  test('should return an error when the provided seasonId is invalid', async ({ driver }) => {
    const registration = registrationBuilder.one({
      overrides: {
        driverId: driver.id
      }
    });

    const result = await createRegistration(registration);
    const error = result._unsafeUnwrapErr();

    expect(error.code).to.equal(ErrorCode.DATABASE_ERROR);
    expect(error.name).to.equal(PostgresErrorCode.ForeignKeyViolation);
    expect(error.message).to.include('season_id');
  });

  test('should create a new registration', async ({
    db, driver, season
  }) => {
    const result = await createRegistration(registrationBuilder.one({
      overrides: {
        driverId: driver.id,
        seasonId: season.id
      }
    }));

    const registration = result._unsafeUnwrap();

    expect(registration.id).to.not.be.null;
    expect(registration).to.include({
      driverId: driver.id,
      seasonId: season.id
    });

    await db
      .deleteFrom('registrations')
      .where('id', '=', registration.id)
      .execute();
  });

  test('should return an error when retrieving a registration with an invalid id', async () => {
    const result = await getRegistrationById(999_999);

    const error = result._unsafeUnwrapErr();
    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.equal('no result');
  });

  test('should return a registration by id', async ({
    db, driver, season
  }) => {
    const created = await createRegistration(registrationBuilder.one({
      overrides: {
        driverId: driver.id,
        seasonId: season.id
      }
    }));
    const registration = created._unsafeUnwrap();

    const result = await getRegistrationById(registration.id);
    expect(result._unsafeUnwrap()).to.include({
      driverId: registration.driverId,
      id: registration.id,
      seasonId: registration.seasonId
    });

    await db
      .deleteFrom('registrations')
      .where('id', '=', registration.id)
      .execute();
  });

  test('should return an error when updating a registration with an invalid id', async () => {
    const registration = registrationRecordBuilder.one({
      overrides: {
        id: 999_999
      }
    });

    const result = await updateRegistration(registration.id, registration);
    const error = result._unsafeUnwrapErr();

    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.equal('no result');
  });

  test('should return an error when deleting a registration with an invalid id', async () => {
    const registration = registrationRecordBuilder.one({
      overrides: {
        id: 999_999
      }
    });

    const result = await deleteRegistration(registration.id);
    const error = result._unsafeUnwrapErr();

    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.include('Registration with id 999999 was not found');
  });

  test('should delete an existing registration', async ({
    db, driver, season
  }) => {
    const existing = await createRegistration(registrationBuilder.one({
      overrides: {
        driverId: driver.id,
        seasonId: season.id
      }
    }));

    const registrationId = existing._unsafeUnwrap().id;

    const deleteResult = await deleteRegistration(registrationId);
    const { numDeletedRows } = deleteResult._unsafeUnwrap();

    expect(Number(numDeletedRows)).to.equal(1);

    await db
      .deleteFrom('registrations')
      .where('id', '=', registrationId)
      .execute();
  });
});
