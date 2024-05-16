import { NoResultError } from 'kysely';
import {
  describe, expect, onTestFinished
} from 'vitest';

import {
  createDriver, deleteDriver, getDriverById, updateDriver
} from '../../src/modules/driver/service.js';
import { driverBuilder } from '../builders/driver.builder.js';
import { test } from '../context.js';

describe('Driver service', () => {
  test('should create a new driver', async ({ db }) => {
    const driver = driverBuilder.one();
    const result = await createDriver(driver);

    expect(result.id).to.not.be.null;
    expect(result).toMatchObject({
      discordId: driver.discordId,
      firstName: driver.firstName,
      lastName: driver.lastName,
      steamId: driver.steamId
    });

    onTestFinished(async () => {
      await db
        .deleteFrom('drivers')
        .where('id', '=', result.id)
        .execute();
    });
  });

  test('should return a driver by id', async ({ db }) => {
    const driver = await createDriver(driverBuilder.one());

    const result = await getDriverById(driver.id);

    expect(result).toMatchObject({
      discordId: driver.discordId,
      firstName: driver.firstName,
      id: driver.id,
      lastName: driver.lastName,
      steamId: driver.steamId
    });

    onTestFinished(async () => {
      await db
        .deleteFrom('drivers')
        .where('id', '=', result.id)
        .execute();
    });
  });

  test('should return a NoResultError when a platform is not found by id', async () => {
    await expect(getDriverById(999_999)).rejects.toThrow(NoResultError);
  });

  test("should update a driver's first name", async ({ db }) => {
    const existing = await createDriver(driverBuilder.one());
    existing.firstName = 'updated first name';

    const result = await updateDriver(existing.id, existing);
    expect(result.firstName).to.equal(existing.firstName);

    onTestFinished(async () => {
      await db
        .deleteFrom('drivers')
        .where('id', '=', result.id)
        .execute();
    });
  });

  test("should update a driver's last name", async ({ db }) => {
    const existing = await createDriver(driverBuilder.one());
    existing.lastName = 'updated last name';

    const result = await updateDriver(existing.id, existing);
    expect(result.lastName).to.equal(existing.lastName);

    onTestFinished(async () => {
      await db
        .deleteFrom('drivers')
        .where('id', '=', result.id)
        .execute();
    });
  });

  test("should update a driver's steam id", async ({ db }) => {
    const existing = await createDriver(driverBuilder.one());
    existing.steamId = '101010101';

    const result = await updateDriver(existing.id, existing);
    expect(result.steamId).to.equal(existing.steamId);

    onTestFinished(async () => {
      await db
        .deleteFrom('drivers')
        .where('id', '=', result.id)
        .execute();
    });
  });

  test("should update a driver's discord id", async ({ db }) => {
    const existing = await createDriver(driverBuilder.one());
    existing.discordId = '12345';

    const result = await updateDriver(existing.id, existing);
    expect(result.discordId).to.equal(existing.discordId);

    onTestFinished(async () => {
      await db
        .deleteFrom('drivers')
        .where('id', '=', result.id)
        .execute();
    });
  });

  test('should delete an existing driver', async () => {
    const existing = await createDriver(driverBuilder.one());

    const result = await deleteDriver(existing.id);

    expect(Number(result.numDeletedRows)).to.equal(1);
  });

  test('should return 0 rows deleted when the driver is not found by id', async () => {
    const result = await deleteDriver(999_999);

    expect(Number(result.numDeletedRows)).to.equal(0);
  });
});
