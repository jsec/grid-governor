import { StatusCodes } from 'http-status-codes';
import { describe, expect } from 'vitest';

import { createPenalty } from '../../src/modules/penalty/service.js';
import { penaltyBuilder } from '../builders/penalty.builder.js';
import { test } from '../context.js';

describe('Penalty API', () => {
  describe('POST', () => {
    test('should return a 400 when the name is not provided', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          description: 'desc'
        },
        url: '/penalty'
      });

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
    });

    test('should return a 400 when the description is not provided', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          name: 'name'
        },
        url: '/penalty'
      });

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
    });

    test('should create a new penalty', async ({ app, db }) => {
      const payload = penaltyBuilder.one();

      const response = await app.inject({
        method: 'POST',
        payload,
        url: '/penalty'
      });

      const body = response.json();

      expect(response.statusCode).toEqual(StatusCodes.CREATED);
      expect(body.id).to.not.be.null;
      expect(body.name).to.equal(payload.name);
      expect(body.description).to.equal(payload.description);

      await db
        .deleteFrom('penalties')
        .where('id', '=', body.id)
        .execute();
    });
  });

  describe('GET', () => {
    test('should return a 404 if no penalty with the given id exists',
      async ({ app }) => {
        const response = await app.inject({
          method: 'GET',
          url: '/penalty/999999'
        });

        const body = response.json();

        expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
        expect(response.statusMessage).to.equal('Not Found');
        expect(body.message).to.equal('no result');
      });

    test('should return a penalty by id', async ({ app, db }) => {
      const penaltyResult = await createPenalty(penaltyBuilder.one());
      const penalty = penaltyResult._unsafeUnwrap();

      const response = await app.inject({
        method: 'GET',
        url: `/penalty/${penalty.id}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body).to.include({
        description: penalty.description,
        id: penalty.id,
        name: penalty.name
      });

      await db
        .deleteFrom('penalties')
        .where('id', '=', body.id)
        .execute();
    });
  });

  describe('PUT', () => {
    test('should return a 404 if no penalty with the given id exists', async ({ app }) => {
      const response = await app.inject({
        method: 'PUT',
        payload: penaltyBuilder.one(),
        url: '/penalty/999999'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      expect(body.message).to.equal('no result');
    });

    test('should update a penalty name', async ({ app, db }) => {
      const penaltyResult = await createPenalty(penaltyBuilder.one());
      const penalty = penaltyResult._unsafeUnwrap();

      penalty.name = 'Updated name';

      const response = await app.inject({
        method: 'PUT',
        payload: penalty,
        url: `/penalty/${penalty.id}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body).to.include({
        id: penalty.id,
        name: penalty.name
      });

      await db
        .deleteFrom('penalties')
        .where('id', '=', body.id)
        .execute();
    });

    test('should update a penalty description', async ({ app, db }) => {
      const penaltyResult = await createPenalty(penaltyBuilder.one());
      const penalty = penaltyResult._unsafeUnwrap();

      penalty.description = 'Updated description';

      const response = await app.inject({
        method: 'PUT',
        payload: penalty,
        url: `/penalty/${penalty.id}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body).to.include({
        description: penalty.description,
        id: penalty.id
      });

      await db
        .deleteFrom('penalties')
        .where('id', '=', body.id)
        .execute();
    });
  });

  describe('DELETE', () => {
    test('should return a 404 if no penalty with the given id exists', async ({ app }) => {
      const penaltyId = 999_999;

      const response = await app.inject({
        method: 'DELETE',
        url: `/penalty/${penaltyId}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      expect(body.message).to.equal(`Penalty with id ${penaltyId} was not found`);
    });

    test('should delete an existing penalty', async ({ app }) => {
      const penaltyResult = await createPenalty(penaltyBuilder.one());

      const { id: penaltyId } = penaltyResult._unsafeUnwrap();

      const response = await app.inject({
        method: 'DELETE',
        url: `/penalty/${penaltyId}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body).toMatchObject({
        status: 'OK'
      });
    });
  });
});
