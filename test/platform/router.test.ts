import type { FastifyInstance } from 'fastify';

import anyTest, { type TestFn } from 'ava';

import { createApp } from '../../src/app.js';
import { db } from '../../src/db/conn.js';
import { createPlatform } from '../../src/modules/platform/service.js';

const test = anyTest as TestFn<{ server: FastifyInstance }>;

test.before((t) => {
  t.context.server = createApp();
});

test('POST - should return a 400 when the name is not provided', async (t) => {
  const response = await t.context.server.inject({
    method: 'POST',
    payload: {},
    url: '/platform'
  });

  t.is(response.statusCode, 400, 'Expected 400');
  t.is(response.statusMessage, 'Bad Request', 'Expected Bad Request');
});

test('POST - should create a new platform', async (t) => {
  const payload = {
    name: 'iRenting'
  };

  const response = await t.context.server.inject({
    method: 'POST',
    payload,
    url: '/platform'
  });

  const body = response.json();

  t.is(response.statusCode, 201, 'Expected 201');
  t.like(body, payload);

  t.teardown(async () => {
    await db
      .deleteFrom('platforms')
      .where('id', '=', body.id)
      .execute();
  });
});

test.todo('GET - should return a 404 if no platform with the given id exists');

test('GET - should return a platform by id', async (t) => {
  const platform = await createPlatform({
    name: 'Test Platform - Get'
  });

  const response = await t.context.server.inject({
    method: 'GET',
    url: `/platform/${platform.id}`
  });

  const body = response.json();

  t.is(response.statusCode, 200, 'Expected 200');
  t.like(body, {
    id: platform.id,
    name: platform.name
  }, 'Expected response to match database entity');

  t.teardown(async () => {
    await db
      .deleteFrom('platforms')
      .where('id', '=', platform.id)
      .execute();
  });
});

test.todo('PUT - should return a 404 if no platform with the given id exists');

test('PUT - should update a platform name', async (t) => {
  const platform = await createPlatform({
    name: 'Test Platform - Update'
  });

  platform.name = 'Updated platform name';

  const response = await t.context.server.inject({
    method: 'PUT',
    payload: platform,
    url: `/platform/${platform.id}`
  });

  const body = response.json();

  t.is(response.statusCode, 200, 'Expected 200');
  t.is(body.name, platform.name, 'Expected updated platform name');

  t.teardown(async () => {
    await db
      .deleteFrom('platforms')
      .where('id', '=', platform.id)
      .execute();
  });
});

// TODO: add tests for delete

test.after.always(async (t) => {
  t.context.server.close();
  await db.destroy();
});
