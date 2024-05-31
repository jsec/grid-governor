import { StatusCodes } from 'http-status-codes';
import { describe, expect } from 'vitest';

import { createRuling } from '../../src/modules/ruling/service.js';
import { PostgresErrorCode } from '../../src/types/errors/postgres.error.js';
import { rulingBuilder, rulingRecordBuilder } from '../builders/ruling.builder.js';
import { test } from '../contexts/ruling.context.js';

describe('Incident API', () => {
  describe('POST', () => {
    test('should return a 400 when no penaltyId is supplied', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          incidentId: 1
        },
        url: '/ruling'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.message).to.include("must have required property 'penaltyId'");
    });

    test('should return a 400 when no incidentId is supplied', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          penaltyId: 1
        },
        url: '/ruling'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.message).to.include("must have required property 'incidentId'");
    });

    test('should return a 400 when the incidentId is invalid', async ({ app, penalty }) => {
      const response = await app.inject({
        method: 'POST',
        payload: rulingBuilder.one({
          overrides: {
            penaltyId: penalty.id
          }
        }),
        url: '/ruling'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.name).to.equal(PostgresErrorCode.ForeignKeyViolation);
      expect(body.message).to.include('incident_id');
    });

    test('should return a 400 when the penaltyId is invalid', async ({ app, incident }) => {
      const response = await app.inject({
        method: 'POST',
        payload: rulingBuilder.one({
          overrides: {
            incidentId: incident.id
          }
        }),
        url: '/ruling'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.name).to.equal(PostgresErrorCode.ForeignKeyViolation);
      expect(body.message).to.include('penalty_id');
    });

    test('should create a new ruling', async ({
      app, db, incident, penalty
    }) => {
      const response = await app.inject({
        method: 'POST',
        payload: rulingBuilder.one({
          overrides: {
            incidentId: incident.id,
            penaltyId: penalty.id
          }
        }),
        url: '/ruling'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.CREATED);
      expect(body.id).not.to.be.null;
      expect(body).toMatchObject({
        incidentId: incident.id,
        penaltyId: penalty.id
      });

      await db
        .deleteFrom('rulings')
        .where('id', '=', body.id)
        .execute();
    });
  });

  describe('GET', () => {
    test('should return a 404 if no ruling with the given id exists', async ({ app }) => {
      const response = await app.inject({
        method: 'GET',
        url: '/ruling/999999'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      expect(body.message).to.equal('no result');
    });

    test('should return a ruling by id', async ({
      app, db, incident, penalty
    }) => {
      const rulingResult = await createRuling(rulingBuilder.one({
        overrides: {
          incidentId: incident.id,
          penaltyId: penalty.id
        }
      }));

      const ruling = rulingResult._unsafeUnwrap();

      const response = await app.inject({
        method: 'GET',
        url: `/ruling/${ruling.id}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body).toMatchObject({
        id: ruling.id,
        incidentId: incident.id,
        penaltyId: penalty.id
      });

      await db
        .deleteFrom('rulings')
        .where('id', '=', ruling.id)
        .execute();
    });
  });

  describe('PUT', () => {
    test('should return a 404 if no ruling with the given id exists', async ({ app }) => {
      const response = await app.inject({
        method: 'PUT',
        payload: rulingBuilder.one(),
        url: '/ruling/999999'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      expect(body.message).to.equal('no result');
    });
  });

  // TODO: delete tests
});
