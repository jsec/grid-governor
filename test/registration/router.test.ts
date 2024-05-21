import { StatusCodes } from 'http-status-codes';
import {
  describe, expect, onTestFinished
} from 'vitest';

import { createDriver } from '../../src/modules/driver/service.js';
import { createLeague } from '../../src/modules/league/service.js';
import { createPlatform } from '../../src/modules/platform/service.js';
import { createRegistration } from '../../src/modules/registration/service.js';
import { createSeason } from '../../src/modules/season/service.js';
import { PostgresErrorCode } from '../../src/types/errors/postgres.error.js';
import { driverBuilder } from '../builders/driver.builder.js';
import { leagueBuilder } from '../builders/league.builder.js';
import { platformBuilder } from '../builders/platform.builder.js';
import { registrationBuilder } from '../builders/registration.builder.js';
import { seasonBuilder } from '../builders/season.builder.js';
import { test } from '../context.js';

describe('Registration API', () => {
  describe('POST', () => {
    test('should return a 400 when no driverId is supplied', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          seasonId: 12
        },
        url: '/registration'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.message).to.include("must have required property 'driverId'");
    });

    test('should return a 400 when no seasonId is supplied', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          driverId: 12
        },
        url: '/registration'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.message).to.include("must have required property 'seasonId'");
    });

    test('should return a 400 when the driverId is invalid', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          driverId: 99_292,
          seasonId: 12
        },
        url: '/registration'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.name).to.equal(PostgresErrorCode.ForeignKeyViolation);
      expect(body.message).to.include('driver_id');
    });

    test('should return a 400 when the seasonId is invalid', async ({ app, db }) => {
      const driver = await createDriver(driverBuilder.one());

      const response = await app.inject({
        method: 'POST',
        payload: {
          driverId: driver.id,
          seasonId: 9999
        },
        url: '/registration'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.name).to.equal(PostgresErrorCode.ForeignKeyViolation);
      expect(body.message).to.include('season_id');

      onTestFinished(async () => {
        await db
          .deleteFrom('drivers')
          .where('id', '=', driver.id)
          .execute();
      });
    });

    test('should create a new registration', async ({ app, db }) => {
      const [platform, league, driver] = await Promise.all([
        createPlatform(platformBuilder.one()),
        createLeague(leagueBuilder.one()),
        createDriver(driverBuilder.one())
      ]);

      const seasonResult = await createSeason(seasonBuilder.one({
        overrides: {
          leagueId: league.id,
          platformId: platform.id
        }
      }));

      const season = seasonResult._unsafeUnwrap();

      const response = await app.inject({
        method: 'POST',
        payload: {
          driverId: driver.id,
          seasonId: season.id
        },
        url: '/registration'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.CREATED);
      expect(body.id).not.to.be.null;
      expect(body).toMatchObject({
        driverId: driver.id,
        seasonId: season.id
      });

      onTestFinished(async () => {
        await db
          .deleteFrom('registrations')
          .where('id', '=', body.id)
          .execute();

        await db
          .deleteFrom('seasons')
          .where('id', '=', season.id)
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

  describe('GET', () => {
    test('should return a 404 if no registration with the given id exists', async ({ app }) => {
      const response = await app.inject({
        method: 'GET',
        url: '/registration/999999'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      expect(body.message).to.equal('no result');
    });

    test('should return a registration by id', async ({ app, db }) => {
      const [platform, league, driver] = await Promise.all([
        createPlatform(platformBuilder.one()),
        createLeague(leagueBuilder.one()),
        createDriver(driverBuilder.one())
      ]);

      const seasonResult = await createSeason(seasonBuilder.one({
        overrides: {
          leagueId: league.id,
          platformId: platform.id
        }
      }));

      const season = seasonResult._unsafeUnwrap();

      const registrationResult = await createRegistration(registrationBuilder.one({
        overrides: {
          driverId: driver.id,
          seasonId: season.id
        }
      }));

      const registration = registrationResult._unsafeUnwrap();

      const response = await app.inject({
        method: 'GET',
        url: `/registration/${registration.id}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body).toMatchObject({
        driverId: registration.driverId,
        id: registration.id,
        seasonId: registration.seasonId
      });

      onTestFinished(async () => {
        await db
          .deleteFrom('registrations')
          .where('id', '=', body.id)
          .execute();

        await db
          .deleteFrom('seasons')
          .where('id', '=', season.id)
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

  describe('PUT', () => {
    test('should return a 404 if no registration with the given id exists', async ({ app }) => {
      const response = await app.inject({
        method: 'PUT',
        payload: registrationBuilder.one(),
        url: '/registration/999999'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      expect(body.message).to.equal('no result');
    });
  });

  // TODO: add delete tests
});
