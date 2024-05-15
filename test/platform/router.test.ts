import { StatusCodes } from 'http-status-codes';
import {
  describe, expect, onTestFinished
} from 'vitest';

import { createPlatform } from '../../src/modules/platform/service.js';
import { test } from '../context.js';
import { platformBuilder } from '../data/platform.builder.js';

describe('Platform API', () => {
  describe('POST', () => {
    test('should return a 400 when the name is not provided', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {},
        url: '/platform'
      });

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
    });

    test('should create a new platform', async ({ app, db }) => {
      const payload = platformBuilder.one();

      const response = await app.inject({
        method: 'POST',
        payload,
        url: '/platform'
      });

      const body = response.json();

      expect(response.statusCode).toEqual(StatusCodes.CREATED);
      expect(body.name).to.equal(payload.name);
      expect(body.id).to.not.be.null;

      onTestFinished(async () => {
        await db
          .deleteFrom('platforms')
          .where('id', '=', body.id)
          .execute();
      });
    });
  });

  describe('GET', () => {
    test.todo('GET - should return a 404 if no platform with the given id exists');

    test('should return a platform by id', async ({ app, db }) => {
      const platform = await createPlatform(platformBuilder.one());

      const response = await app.inject({
        method: 'GET',
        url: `/platform/${platform.id}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body.id).to.equal(platform.id);
      expect(body.name).to.equal(platform.name);

      onTestFinished(async () => {
        await db
          .deleteFrom('platforms')
          .where('id', '=', body.id)
          .execute();
      });
    });
  });

  describe('PUT', () => {
    test.todo('PUT - should return a 404 if no platform with the given id exists');

    test('should update a platform name', async ({ app, db }) => {
      const platform = await createPlatform(platformBuilder.one());

      platform.name = 'Updated name';

      const response = await app.inject({
        method: 'PUT',
        payload: platform,
        url: `/platform/${platform.id}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body.id).to.equal(platform.id);
      expect(body.name).to.equal(platform.name);

      onTestFinished(async () => {
        await db
          .deleteFrom('platforms')
          .where('id', '=', body.id)
          .execute();
      });
    });
  });
});
