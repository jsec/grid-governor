import { StatusCodes } from 'http-status-codes';
import {
  describe, expect, onTestFinished
} from 'vitest';

import { createDriver } from '../../src/modules/driver/service.js';
import { driverBuilder } from '../builders/driver.builder.js';
import { test } from '../context.js';

describe('Driver API', () => {
  describe('POST', () => {
    test('should return a 400 when the first name is not provided', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          discordId: 'cde',
          lastName: 'Smith',
          steamId: 'abc'
        },
        url: '/driver'
      });

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
    });

    test('should return a 400 when the last name is not provided', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          discordId: 'cde',
          firstName: 'Bob',
          steamId: 'abc'
        },
        url: '/driver'
      });

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
    });

    test('should return a 400 when the discord id is not provided', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          firstName: 'Bob',
          lastName: 'Smith',
          steamId: 'abc'
        },
        url: '/driver'
      });

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
    });

    test('should return a 400 when the steam id is not provided', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          discordId: 'abc',
          firstName: 'Bob',
          lastName: 'Smith'
        },
        url: '/driver'
      });

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
    });

    test('should create a new driver', async ({ app, db }) => {
      const payload = driverBuilder.one();

      const response = await app.inject({
        method: 'POST',
        payload,
        url: '/driver'
      });

      const body = response.json();

      expect(response.statusCode).toEqual(StatusCodes.CREATED);
      expect(body.id).to.not.be.null;

      expect(body).toMatchObject({
        discordId: payload.discordId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        steamId: payload.steamId
      });

      onTestFinished(async () => {
        await db
          .deleteFrom('drivers')
          .where('id', '=', body.id)
          .execute();
      });
    });
  });

  describe('GET', () => {
    test('GET - should return a 404 if no driver with the given id exists', async ({ app }) => {
      const response = await app.inject({
        method: 'GET',
        url: '/driver/999999'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      expect(body.message).to.equal('no result');
    });

    test('should return a driver by id', async ({ app, db }) => {
      const driverResult = await createDriver(driverBuilder.one());
      const driver = driverResult._unsafeUnwrap();

      const response = await app.inject({
        method: 'GET',
        url: `/driver/${driver.id}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body).toMatchObject({
        discordId: driver.discordId,
        firstName: driver.firstName,
        id: driver.id,
        lastName: driver.lastName,
        steamId: driver.steamId
      });

      await db
        .deleteFrom('drivers')
        .where('id', '=', body.id)
        .execute();
    });
  });

  describe('PUT', () => {
    test('PUT - should return a 404 if no driver with the given id exists', async ({ app }) => {
      const response = await app.inject({
        method: 'PUT',
        payload: driverBuilder.one(),
        url: '/driver/999999'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      expect(body.message).to.equal('no result');
    });

    test("should update a driver's first name", async ({ app, db }) => {
      const driverResult = await createDriver(driverBuilder.one());
      const driver = driverResult._unsafeUnwrap();

      driver.firstName = 'Updated first name';

      const response = await app.inject({
        method: 'PUT',
        payload: driver,
        url: `/driver/${driver.id}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body.id).to.equal(driver.id);
      expect(body.firstName).to.equal(driver.firstName);

      await db
        .deleteFrom('drivers')
        .where('id', '=', body.id)
        .execute();
    });

    test("should update a driver's last name", async ({ app, db }) => {
      const driverResult = await createDriver(driverBuilder.one());
      const driver = driverResult._unsafeUnwrap();

      driver.lastName = 'Updated last name';

      const response = await app.inject({
        method: 'PUT',
        payload: driver,
        url: `/driver/${driver.id}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body.id).to.equal(driver.id);
      expect(body.lastName).to.equal(driver.lastName);

      await db
        .deleteFrom('drivers')
        .where('id', '=', body.id)
        .execute();
    });

    test("should update a driver's steam id", async ({ app, db }) => {
      const driverResult = await createDriver(driverBuilder.one());
      const driver = driverResult._unsafeUnwrap();

      driver.steamId = 'abcdefghi';

      const response = await app.inject({
        method: 'PUT',
        payload: driver,
        url: `/driver/${driver.id}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body.id).to.equal(driver.id);
      expect(body.steamId).to.equal(driver.steamId);

      await db
        .deleteFrom('drivers')
        .where('id', '=', body.id)
        .execute();
    });

    test("should update a driver's discord id", async ({ app, db }) => {
      const driverResult = await createDriver(driverBuilder.one());
      const driver = driverResult._unsafeUnwrap();

      driver.discordId = '17284182';

      const response = await app.inject({
        method: 'PUT',
        payload: driver,
        url: `/driver/${driver.id}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body.id).to.equal(driver.id);
      expect(body.discordId).to.equal(driver.discordId);

      await db
        .deleteFrom('drivers')
        .where('id', '=', body.id)
        .execute();
    });
  });
});
