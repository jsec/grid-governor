import { StatusCodes } from 'http-status-codes';
import {
  describe, expect
} from 'vitest';

import { createPlatform } from '../../src/modules/platform/service.js';
import { platformBuilder } from '../builders/platform.builder.js';
import { test } from '../context.js';

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

      await db
        .deleteFrom('platforms')
        .where('id', '=', body.id)
        .execute();
    });
  });

  describe('GET', () => {
    test('GET - should return a 404 if no platform with the given id exists', async ({ app }) => {
      const response = await app.inject({
        method: 'GET',
        url: '/platform/999999'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      expect(body.message).to.equal('no result');
    });

    test('should return a platform by id', async ({ app, db }) => {
      const createResult = await createPlatform(platformBuilder.one());
      const platform = createResult._unsafeUnwrap();

      const response = await app.inject({
        method: 'GET',
        url: `/platform/${platform.id}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body.id).to.equal(platform.id);
      expect(body.name).to.equal(platform.name);

      await db
        .deleteFrom('platforms')
        .where('id', '=', body.id)
        .execute();
    });
  });

  describe('PUT', () => {
    test('PUT - should return a 404 if no platform with the given id exists', async ({ app }) => {
      const response = await app.inject({
        method: 'PUT',
        payload: platformBuilder.one(),
        url: '/platform/999999'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      expect(body.message).to.equal('no result');
    });

    test('should update a platform name', async ({ app, db }) => {
      const createResult = await createPlatform(platformBuilder.one());
      const platform = createResult._unsafeUnwrap();

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

      await db
        .deleteFrom('platforms')
        .where('id', '=', body.id)
        .execute();
    });
  });

  describe('DELETE', () => {
    test('should return a 404 if no platform with the given id exists', async ({ app }) => {
      const platformId = 999_999;

      const response = await app.inject({
        method: 'DELETE',
        url: `/platform/${platformId}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      expect(body.message).to.equal(`Platform with id ${platformId} was not found`);
    });

    test('should delete an existing platform', async ({ app }) => {
      const platformResult = await createPlatform(platformBuilder.one());

      const { id: platformId } = platformResult._unsafeUnwrap();

      const response = await app.inject({
        method: 'DELETE',
        url: `/platform/${platformId}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body).toMatchObject({
        status: 'OK'
      });
    });
  });
});
