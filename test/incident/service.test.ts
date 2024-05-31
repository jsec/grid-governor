import { describe, expect } from 'vitest';

import {
  createIncident, deleteIncident, getIncidentById, updateIncident
} from '../../src/modules/incident/service.js';
import { ErrorCode } from '../../src/types/errors/app.error.js';
import { PostgresErrorCode } from '../../src/types/errors/postgres.error.js';
import { incidentBuilder, incidentRecordBuilder } from '../builders/incident.builder.js';
import { test } from '../contexts/incident.context.js';

describe('Registration service', () => {
  test('should return an error when the provided driverId is invalid',
    async ({ race, reportingDriver }) => {
      const incident = incidentBuilder.one({
        overrides: {
          driverId: 999_999,
          raceId: race.id,
          reportingDriverId: reportingDriver.id
        }
      });

      const result = await createIncident(incident);
      const error = result._unsafeUnwrapErr();

      expect(error.code).to.equal(ErrorCode.DATABASE_ERROR);
      expect(error.name).to.equal(PostgresErrorCode.ForeignKeyViolation);
      expect(error.message).to.include('driver_id');
    });

  test('should return an error when the provided reportingDriverId is invalid',
    async ({ driver, race }) => {
      const incident = incidentBuilder.one({
        overrides: {
          driverId: driver.id,
          raceId: race.id,
          reportingDriverId: 999_999
        }
      });

      const result = await createIncident(incident);
      const error = result._unsafeUnwrapErr();

      expect(error.code).to.equal(ErrorCode.DATABASE_ERROR);
      expect(error.name).to.equal(PostgresErrorCode.ForeignKeyViolation);
      expect(error.message).to.include('reporting_driver_id');
    });

  test('should return an error when the provided raceId is invalid',
    async () => {
      const incident = incidentBuilder.one();

      const result = await createIncident(incident);
      const error = result._unsafeUnwrapErr();

      expect(error.code).to.equal(ErrorCode.DATABASE_ERROR);
      expect(error.name).to.equal(PostgresErrorCode.ForeignKeyViolation);
      expect(error.message).to.include('race_id');
    });

  test('should create a new incident', async ({
    db, driver, race, reportingDriver
  }) => {
    const result = await createIncident(incidentBuilder.one({
      overrides: {
        description: 'He dun goofed',
        driverId: driver.id,
        lapNumber: 5,
        raceId: race.id,
        reportingDriverId: reportingDriver.id
      }
    }));

    const incident = result._unsafeUnwrap();

    expect(incident.id).to.not.be.null;
    expect(incident).toMatchObject({
      driverId: driver.id,
      raceId: race.id,
      reportingDriverId: reportingDriver.id
    });

    await db
      .deleteFrom('incidents')
      .where('id', '=', incident.id)
      .execute();
  });

  test('should return an error when retrieving an incident with an invalid id', async () => {
    const result = await getIncidentById(999_999);

    const error = result._unsafeUnwrapErr();
    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.equal('no result');
  });

  test('should return an incident by id', async ({
    db, driver, race, reportingDriver
  }) => {
    const created = await createIncident(incidentBuilder.one({
      overrides: {
        description: 'He dun goofed',
        driverId: driver.id,
        lapNumber: 5,
        raceId: race.id,
        reportingDriverId: reportingDriver.id
      }
    }));

    const incident = created._unsafeUnwrap();

    const result = await getIncidentById(incident.id);
    expect(result._unsafeUnwrap()).toMatchObject(incident);

    await db
      .deleteFrom('incidents')
      .where('id', '=', incident.id)
      .execute();
  });

  test('should return an error when updating an incident with an invalid id', async () => {
    const incident = incidentRecordBuilder.one({
      overrides: {
        id: 999_999
      }
    });

    const result = await updateIncident(incident.id, incident);
    const error = result._unsafeUnwrapErr();

    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.equal('no result');
  });

  test('should return an error when deleting an incident with an invalid id', async () => {
    const result = await deleteIncident(999_999);
    const error = result._unsafeUnwrapErr();

    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.include('Incident with id 999999 was not found');
  });

  test('should delete an existing incident', async ({
    db, driver, race, reportingDriver
  }) => {
    const existing = await createIncident(incidentBuilder.one({
      overrides: {
        description: 'He dun goofed',
        driverId: driver.id,
        lapNumber: 5,
        raceId: race.id,
        reportingDriverId: reportingDriver.id
      }
    }));

    const incidentId = existing._unsafeUnwrap().id;

    const deleteResult = await deleteIncident(incidentId);
    const { numDeletedRows } = deleteResult._unsafeUnwrap();

    expect(Number(numDeletedRows)).to.equal(1);

    await db
      .deleteFrom('incidents')
      .where('id', '=', incidentId)
      .execute();
  });
});