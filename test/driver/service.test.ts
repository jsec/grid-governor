import { describe, expect } from 'vitest';

import {
  createDriver,
  deleteDriver,
  getDriverById,
  updateDriver,
} from '../../src/modules/driver/service.js';
import { ErrorCode } from '../../src/types/errors/app.error.js';
import { driverBuilder, driverRecordBuilder } from '../builders/driver.builder.js';
import { test } from '../context.js';

describe('Driver service', () => {
  test('should create a new driver', async ({ db }) => {
    const newDriver = driverBuilder.one();
    const result = await createDriver(newDriver);

    const driver = result._unsafeUnwrap();

    expect(driver.id).to.not.be.null;
    expect(driver).to.include({
      discordId: newDriver.discordId,
      firstName: newDriver.firstName,
      lastName: newDriver.lastName,
      steamId: newDriver.steamId,
    });

    await db
      .deleteFrom('drivers')
      .where('id', '=', driver.id)
      .execute();
  });

  test('should return an error when retrieving a driver with an invalid id', async () => {
    const result = await getDriverById(999_999);

    const error = result._unsafeUnwrapErr();
    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.equal('no result');
  });

  test('should return a driver by id', async ({ db }) => {
    const driverResult = await createDriver(driverBuilder.one());
    const existing = driverResult._unsafeUnwrap();

    const result = await getDriverById(existing.id);
    const driver = result._unsafeUnwrap();

    expect(driver).to.include({
      discordId: driver.discordId,
      firstName: driver.firstName,
      id: driver.id,
      lastName: driver.lastName,
      steamId: driver.steamId,
    });

    await db
      .deleteFrom('drivers')
      .where('id', '=', driver.id)
      .execute();
  });

  test('should return an error when updating a driver with an invalid id', async () => {
    const driver = driverRecordBuilder.one({
      overrides: {
        id: 999_999,
      },
    });

    const result = await updateDriver(driver.id, driver);

    const error = result._unsafeUnwrapErr();
    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.equal('no result');
  });

  test('should modify the updatedAt timestamp when updating a driver', async ({ db }) => {
    const createResult = await createDriver(driverBuilder.one());
    const created = createResult._unsafeUnwrap();

    created.lastName = 'Test last name';

    const updateResult = await updateDriver(created.id, created);
    const update = updateResult._unsafeUnwrap();

    expect(update.updatedAt).to.not.equal(created.updatedAt);

    await db
      .deleteFrom('drivers')
      .where('id', '=', update.id)
      .execute();
  });

  test('should update a driver\'s first name', async ({ db }) => {
    const createResult = await createDriver(driverBuilder.one());
    const created = createResult._unsafeUnwrap();

    created.firstName = 'updated first name';

    const updateResult = await updateDriver(created.id, created);
    const update = updateResult._unsafeUnwrap();

    expect(update.firstName).to.equal(created.firstName);

    await db
      .deleteFrom('drivers')
      .where('id', '=', update.id)
      .execute();
  });

  test('should update a driver\'s last name', async ({ db }) => {
    const createResult = await createDriver(driverBuilder.one());
    const created = createResult._unsafeUnwrap();

    created.lastName = 'updated last name';

    const updateResult = await updateDriver(created.id, created);
    const update = updateResult._unsafeUnwrap();

    expect(update.lastName).to.equal(created.lastName);

    await db
      .deleteFrom('drivers')
      .where('id', '=', update.id)
      .execute();
  });

  test('should update a driver\'s steam id', async ({ db }) => {
    const createResult = await createDriver(driverBuilder.one());
    const created = createResult._unsafeUnwrap();

    created.steamId = '12345';

    const updateResult = await updateDriver(created.id, created);
    const update = updateResult._unsafeUnwrap();

    expect(update.steamId).to.equal(created.steamId);

    await db
      .deleteFrom('drivers')
      .where('id', '=', update.id)
      .execute();
  });

  test('should update a driver\'s discord id', async ({ db }) => {
    const createResult = await createDriver(driverBuilder.one());
    const created = createResult._unsafeUnwrap();

    created.discordId = '12345';

    const updateResult = await updateDriver(created.id, created);
    const update = updateResult._unsafeUnwrap();

    expect(update.discordId).to.equal(created.discordId);

    await db
      .deleteFrom('drivers')
      .where('id', '=', update.id)
      .execute();
  });

  test('should return an error when deleting a driver with an invalid id', async () => {
    const result = await deleteDriver(999_999);
    const error = result._unsafeUnwrapErr();

    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.include('Driver with id 999999 was not found');
  });

  test('should delete an existing driver', async () => {
    const result = await createDriver(driverBuilder.one());
    const { id: driverId } = result._unsafeUnwrap();

    const deleteResult = await deleteDriver(driverId);
    const { status } = deleteResult._unsafeUnwrap();
    expect(status).to.equal('OK');
  });
});
