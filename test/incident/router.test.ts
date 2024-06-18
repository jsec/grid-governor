import { StatusCodes } from 'http-status-codes';
import { describe, expect } from 'vitest';

import { createIncident } from '../../src/modules/incident/service.js';
import { PostgresErrorCode } from '../../src/types/errors/postgres.error.js';
import { incidentBuilder } from '../builders/incident.builder.js';
import { test } from '../context.js';

describe('Incident API', () => {
  describe('POST', () => {
    test('should return a 400 when no raceId is supplied', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          description: 'He dun goofed',
          driverId: 1,
          lapNumber: 5,
          reportingDriverId: 3
        },
        url: '/incident'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.message).to.include("must have required property 'raceId'");
    });

    test('should return a 400 when no driverId is supplied', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          description: 'He dun goofed',
          lapNumber: 2,
          raceId: 3,
          reportingDriverId: 4,
        },
        url: '/incident'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.message).to.include("must have required property 'driverId'");
    });

    test('should return a 400 when no reportingDriverId is supplied', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          description: 'He dun goofed',
          driverId: 4,
          lapNumber: 2,
          raceId: 3,
        },
        url: '/incident'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.message).to.include("must have required property 'reportingDriverId'");
    });

    test('should return a 400 when no lapNumber is supplied', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          description: 'He dun goofed',
          driverId: 4,
          raceId: 3,
          reportingDriverId: 2,
        },
        url: '/incident'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.message).to.include("must have required property 'lapNumber'");
    });

    test('should return a 400 when no description is supplied', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          driverId: 4,
          lapNumber: 1,
          raceId: 3,
          reportingDriverId: 2,
        },
        url: '/incident'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.message).to.include("must have required property 'description'");
    });

    test('should return a 400 when the driverId is invalid', async ({
      app, race, reportingDriver
    }) => {
      const response = await app.inject({
        method: 'POST',
        payload: incidentBuilder.one({
          overrides: {
            raceId: race.id,
            reportingDriverId: reportingDriver.id
          }
        }),
        url: '/incident'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.name).to.equal(PostgresErrorCode.ForeignKeyViolation);
      expect(body.message).to.include('driver_id');
    });

    test('should return a 400 when the reportingDriverId is invalid', async ({
      app, driver, race
    }) => {
      const response = await app.inject({
        method: 'POST',
        payload: incidentBuilder.one({
          overrides: {
            driverId: driver.id,
            raceId: race.id
          }
        }),
        url: '/incident'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.name).to.equal(PostgresErrorCode.ForeignKeyViolation);
      expect(body.message).to.include('reporting_driver_id');
    });

    test('should return a 400 when the raceId is invalid', async ({
      app, driver, reportingDriver
    }) => {
      const response = await app.inject({
        method: 'POST',
        payload: incidentBuilder.one({
          overrides: {
            driverId: driver.id,
            reportingDriverId: reportingDriver.id
          }
        }),
        url: '/incident'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.name).to.equal(PostgresErrorCode.ForeignKeyViolation);
      expect(body.message).to.include('race_id');
    });

    test('should create a new race', async ({
      app, db, driver, race, reportingDriver
    }) => {
      const response = await app.inject({
        method: 'POST',
        payload: incidentBuilder.one({
          overrides: {
            driverId: driver.id,
            raceId: race.id,
            reportingDriverId: reportingDriver.id
          }
        }),
        url: '/incident'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.CREATED);
      expect(body.id).not.to.be.null;
      expect(body).to.include({
        driverId: driver.id,
        raceId: race.id,
        reportingDriverId: reportingDriver.id,
      });

      await db
        .deleteFrom('incidents')
        .where('id', '=', body.id)
        .execute();
    });
  });

  describe('GET', () => {
    test('should return a 404 if no incident with the given id exists', async ({ app }) => {
      const response = await app.inject({
        method: 'GET',
        url: '/incident/999999'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      expect(body.message).to.equal('no result');
    });

    test('should return an incident by id', async ({
      app, db, driver, race, reportingDriver
    }) => {
      const incidentResult = await createIncident(incidentBuilder.one({
        overrides: {
          driverId: driver.id,
          raceId: race.id,
          reportingDriverId: reportingDriver.id
        }
      }));

      const incident = incidentResult._unsafeUnwrap();

      const response = await app.inject({
        method: 'GET',
        url: `/incident/${incident.id}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body).to.include({
        driverId: driver.id,
        id: incident.id,
        raceId: race.id,
        reportingDriverId: reportingDriver.id
      });

      await db
        .deleteFrom('incidents')
        .where('id', '=', incident.id)
        .execute();
    });
  });

  describe('PUT', () => {
    test('should return a 404 if no incident with the given id exists', async ({ app }) => {
      const response = await app.inject({
        method: 'PUT',
        payload: incidentBuilder.one(),
        url: '/incident/999999'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      expect(body.message).to.equal('no result');
    });
  });

  describe('DELETE', () => {
    test('should return a 404 if no incident with the given id exists', async ({ app }) => {
      const incidentId = 999_999;

      const response = await app.inject({
        method: 'DELETE',
        url: `/incident/${incidentId}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      expect(body.message).to.equal(`Incident with id ${incidentId} was not found`);
    });

    test('delete an existing incident', async ({
      app, driver, race, reportingDriver
    }) => {
      const incidentResult = await createIncident(incidentBuilder.one({
        overrides: {
          driverId: driver.id,
          raceId: race.id,
          reportingDriverId: reportingDriver.id
        }
      }));

      const { id: incidentId } = incidentResult._unsafeUnwrap();

      const response = await app.inject({
        method: 'DELETE',
        url: `/incident/${incidentId}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body).toMatchObject({
        status: 'OK'
      });
    });
  });
});
