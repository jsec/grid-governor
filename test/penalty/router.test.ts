import { StatusCodes } from 'http-status-codes';
import {
  describe, expect, onTestFinished
} from 'vitest';

import { createPenalty } from '../../src/modules/penalty/service.js';
import { penaltyBuilder } from '../builders/penalty.builder.js';
import { test } from '../contexts/base.context.js';

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

      onTestFinished(async () => {
        await db
          .deleteFrom('penalties')
          .where('id', '=', body.id)
          .execute();
      });
    });
  });

  describe('GET', () => {
    test.todo('GET - should return a 404 if no penalty with the given id exists');

    test('should return a penalty by id', async ({ app, db }) => {
      const penalty = await createPenalty(penaltyBuilder.one());

      const response = await app.inject({
        method: 'GET',
        url: `/penalty/${penalty.id}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body.id).to.equal(penalty.id);
      expect(body.name).to.equal(penalty.name);
      expect(body.description).to.equal(penalty.description);

      onTestFinished(async () => {
        await db
          .deleteFrom('penalties')
          .where('id', '=', body.id)
          .execute();
      });
    });
  });

  describe('PUT', () => {
    test.todo('PUT - should return a 404 if no penalty with the given id exists');

    test('should update a penalty name', async ({ app, db }) => {
      const penalty = await createPenalty(penaltyBuilder.one());

      penalty.name = 'Updated name';

      const response = await app.inject({
        method: 'PUT',
        payload: penalty,
        url: `/penalty/${penalty.id}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body.id).to.equal(penalty.id);
      expect(body.name).to.equal(penalty.name);

      onTestFinished(async () => {
        await db
          .deleteFrom('penalties')
          .where('id', '=', body.id)
          .execute();
      });
    });

    test('should update a penalty description', async ({ app, db }) => {
      const penalty = await createPenalty(penaltyBuilder.one());

      penalty.description = 'Updated description';

      const response = await app.inject({
        method: 'PUT',
        payload: penalty,
        url: `/penalty/${penalty.id}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body.id).to.equal(penalty.id);
      expect(body.description).to.equal(penalty.description);

      onTestFinished(async () => {
        await db
          .deleteFrom('penalties')
          .where('id', '=', body.id)
          .execute();
      });
    });
  });
});
