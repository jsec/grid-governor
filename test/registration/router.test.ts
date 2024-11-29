import { StatusCodes } from 'http-status-codes';
import { describe, expect } from 'vitest';

import { createRegistration } from '../../src/modules/registration/service.js';
import { PostgresErrorCode } from '../../src/types/errors/postgres.error.js';
import { registrationBuilder } from '../builders/registration.builder.js';
import { test } from '../context.js';

describe('Registration API', () => {
  describe('POST', () => {
    test('should return a 400 when no driverId is supplied', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          seasonId: 12,
        },
        url: '/registration',
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.message).to.include('must have required property \'driverId\'');
    });

    test('should return a 400 when no seasonId is supplied', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          driverId: 12,
        },
        url: '/registration',
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.message).to.include('must have required property \'seasonId\'');
    });

    test('should return a 400 when the driverId is invalid', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          driverId: 99_292,
          seasonId: 12,
        },
        url: '/registration',
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.name).to.equal(PostgresErrorCode.ForeignKeyViolation);
      expect(body.message).to.include('driver_id');
    });

    test('should return a 400 when the seasonId is invalid', async ({ app, driver }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          driverId: driver.id,
          seasonId: 9999,
        },
        url: '/registration',
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.name).to.equal(PostgresErrorCode.ForeignKeyViolation);
      expect(body.message).to.include('season_id');
    });

    test('should create a new registration', async ({
      app, db, driver, season,
    }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          driverId: driver.id,
          seasonId: season.id,
        },
        url: '/registration',
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.CREATED);
      expect(body.id).not.to.be.null;
      expect(body).to.include({
        driverId: driver.id,
        seasonId: season.id,
      });

      await db
        .deleteFrom('registrations')
        .where('id', '=', body.id)
        .execute();
    });
  });

  describe('GET', () => {
    test('should return a 404 if no registration with the given id exists', async ({ app }) => {
      const response = await app.inject({
        method: 'GET',
        url: '/registration/999999',
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      expect(body.message).to.equal('no result');
    });

    test('should return a registration by id', async ({
      app, db, driver, season,
    }) => {
      const registrationResult = await createRegistration(registrationBuilder.one({
        overrides: {
          driverId: driver.id,
          seasonId: season.id,
        },
      }));

      const registration = registrationResult._unsafeUnwrap();

      const response = await app.inject({
        method: 'GET',
        url: `/registration/${registration.id}`,
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body).to.include({
        driverId: registration.driverId,
        id: registration.id,
        seasonId: registration.seasonId,
      });

      await db
        .deleteFrom('registrations')
        .where('id', '=', body.id)
        .execute();
    });
  });

  describe('PUT', () => {
    test('should return a 404 if no registration with the given id exists', async ({ app }) => {
      const response = await app.inject({
        method: 'PUT',
        payload: registrationBuilder.one(),
        url: '/registration/999999',
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      expect(body.message).to.equal('no result');
    });
  });

  describe('DELETE', () => {
    test('should return a 404 if no registration with the given id exists', async ({ app }) => {
      const registrationId = 999_999;

      const response = await app.inject({
        method: 'DELETE',
        url: `/registration/${registrationId}`,
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      expect(body.message).to.equal(`Registration with id ${registrationId} was not found`);
    });

    test('should delete an existing registration', async ({
      app, driver, season,
    }) => {
      const registrationResult = await createRegistration(registrationBuilder.one({
        overrides: {
          driverId: driver.id,
          seasonId: season.id,
        },
      }));

      const { id: registrationId } = registrationResult._unsafeUnwrap();

      const response = await app.inject({
        method: 'DELETE',
        url: `/registration/${registrationId}`,
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body).toMatchObject({
        status: 'OK',
      });
    });
  });
});
