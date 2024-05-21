import {
  describe, expect, onTestFinished
} from 'vitest';

import { createDriver } from '../../src/modules/driver/service.js';
import { createLeague } from '../../src/modules/league/service.js';
import { createPlatform } from '../../src/modules/platform/service.js';
import {
  createRegistration, deleteRegistration, getRegistrationById, updateRegistration
} from '../../src/modules/registration/service.js';
import { createSeason } from '../../src/modules/season/service.js';
import { ErrorCode } from '../../src/types/errors/app.error.js';
import { PostgresErrorCode } from '../../src/types/errors/postgres.error.js';
import { driverBuilder } from '../builders/driver.builder.js';
import { leagueBuilder } from '../builders/league.builder.js';
import { platformBuilder } from '../builders/platform.builder.js';
import {
  registrationBuilder,
  registrationRecordBuilder
} from '../builders/registration.builder.js';
import { seasonBuilder } from '../builders/season.builder.js';
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

  test('should return an error when the provided seasonId is invalid', async ({ db }) => {
    const driver = await createDriver(driverBuilder.one());
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

    onTestFinished(async () => {
      await db
        .deleteFrom('drivers')
        .where('id', '=', driver.id)
        .execute();
    });
  });

  test('should create a new registration', async ({ db }) => {
    const driver = await createDriver(driverBuilder.one());
    const league = await createLeague(leagueBuilder.one());
    const platform = await createPlatform(platformBuilder.one());
    const season = await createSeason(seasonBuilder.one({
      overrides: {
        leagueId: league.id,
        platformId: platform.id
      }
    }));

    const result = await createRegistration(registrationBuilder.one({
      overrides: {
        driverId: driver.id,
        seasonId: season._unsafeUnwrap().id
      }
    }));

    const registration = result._unsafeUnwrap();

    expect(registration.id).to.not.be.null;
    expect(registration).toMatchObject({
      driverId: driver.id,
      seasonId: season._unsafeUnwrap().id
    });

    onTestFinished(async () => {
      await db
        .deleteFrom('registrations')
        .where('id', '=', registration.id)
        .execute();

      await db
        .deleteFrom('seasons')
        .where('id', '=', season._unsafeUnwrap().id)
        .execute();

      await db
        .deleteFrom('leagues')
        .where('id', '=', league.id)
        .execute();

      await db
        .deleteFrom('drivers')
        .where('id', '=', driver.id)
        .execute();
    });
  });

  test('should return an error when retrieving a registration with an invalid id', async () => {
    const result = await getRegistrationById(999_999);

    const error = result._unsafeUnwrapErr();
    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.equal('no result');
  });

  test('should return a registration by id', async ({ db }) => {
    const driver = await createDriver(driverBuilder.one());
    const league = await createLeague(leagueBuilder.one());
    const platform = await createPlatform(platformBuilder.one());
    const season = await createSeason(seasonBuilder.one({
      overrides: {
        leagueId: league.id,
        platformId: platform.id
      }
    }));

    const created = await createRegistration(registrationBuilder.one({
      overrides: {
        driverId: driver.id,
        seasonId: season._unsafeUnwrap().id
      }
    }));
    const registration = created._unsafeUnwrap();

    const result = await getRegistrationById(registration.id);
    expect(result._unsafeUnwrap()).toMatchObject(registration);

    onTestFinished(async () => {
      await db
        .deleteFrom('registrations')
        .where('id', '=', registration.id)
        .execute();

      await db
        .deleteFrom('seasons')
        .where('id', '=', season._unsafeUnwrap().id)
        .execute();

      await db
        .deleteFrom('leagues')
        .where('id', '=', league.id)
        .execute();

      await db
        .deleteFrom('drivers')
        .where('id', '=', driver.id)
        .execute();
    });
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

  test('should delete an existing registration', async ({ db }) => {
    const driver = await createDriver(driverBuilder.one());
    const league = await createLeague(leagueBuilder.one());
    const platform = await createPlatform(platformBuilder.one());
    const season = await createSeason(seasonBuilder.one({
      overrides: {
        leagueId: league.id,
        platformId: platform.id
      }
    }));

    const existing = await createRegistration(registrationBuilder.one({
      overrides: {
        driverId: driver.id,
        seasonId: season._unsafeUnwrap().id
      }
    }));
    const registrationId = existing._unsafeUnwrap().id;

    const deleteResult = await deleteRegistration(registrationId);
    const { numDeletedRows } = deleteResult._unsafeUnwrap();

    expect(Number(numDeletedRows)).to.equal(1);

    onTestFinished(async () => {
      await db
        .deleteFrom('registrations')
        .where('id', '=', registrationId)
        .execute();

      await db
        .deleteFrom('seasons')
        .where('id', '=', season._unsafeUnwrap().id)
        .execute();

      await db
        .deleteFrom('leagues')
        .where('id', '=', league.id)
        .execute();

      await db
        .deleteFrom('drivers')
        .where('id', '=', driver.id)
        .execute();
    });
  });
});
