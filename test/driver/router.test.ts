import type { FastifyInstance } from 'fastify';

import anyTest, { type TestFn } from 'ava';

import { createApp } from '../../src/app.js';
import { db } from '../../src/db/conn.js';
import { createDriver } from '../../src/modules/driver/service.js';

const test = anyTest as TestFn<{ server: FastifyInstance }>;

test.before((t) => {
  t.context.server = createApp();
});

test('POST - should return a 400 when the first name is not provided', async (t) => {
  const response = await t.context.server.inject({
    method: 'POST',
    payload: {
      discordId: 'cde',
      lastName: 'Smith',
      steamId: 'abc'
    },
    url: '/driver'
  });

  t.is(response.statusCode, 400, 'Expected 400');
  t.is(response.statusMessage, 'Bad Request', 'Expected Bad Request');
});

test('POST - should return a 400 when the last name is not provided', async (t) => {
  const response = await t.context.server.inject({
    method: 'POST',
    payload: {
      discordId: 'cde',
      firstName: 'Bob',
      steamId: 'abc'
    },
    url: '/driver'
  });

  t.is(response.statusCode, 400, 'Expected 400');
  t.is(response.statusMessage, 'Bad Request', 'Expected Bad Request');
});

test('POST - should return a 400 when the discord id is not provided', async (t) => {
  const response = await t.context.server.inject({
    method: 'POST',
    payload: {
      firstName: 'Bob',
      lastName: 'Smith',
      steamId: 'abc'
    },
    url: '/driver'
  });

  t.is(response.statusCode, 400, 'Expected 400');
  t.is(response.statusMessage, 'Bad Request', 'Expected Bad Request');
});

test('POST - should return a 400 when the steam id is not provided', async (t) => {
  const response = await t.context.server.inject({
    method: 'POST',
    payload: {
      discordId: 'abc',
      firstName: 'Bob',
      lastName: 'Smith'
    },
    url: '/driver'
  });

  t.is(response.statusCode, 400, 'Expected 400');
  t.is(response.statusMessage, 'Bad Request', 'Expected Bad Request');
});

test('POST - should create a new driver', async (t) => {
  const payload = {
    discordId: 'cde',
    firstName: 'Bob',
    lastName: 'Smith',
    steamId: 'abc'
  };

  const response = await t.context.server.inject({
    method: 'POST',
    payload,
    url: '/driver'
  });

  const body = response.json();

  t.is(response.statusCode, 201, 'Expected 201');
  t.like(body, payload);

  t.teardown(async () => {
    await db
      .deleteFrom('drivers')
      .where('id', '=', body.id)
      .execute();
  });
});

test.todo('GET - should return a 404 if no driver with the given id exists');

test('GET - should return a driver by id', async (t) => {
  const driver = await createDriver({
    discordId: '444',
    firstName: 'Joe',
    lastName: 'Brown',
    steamId: '123'
  });

  const response = await t.context.server.inject({
    method: 'GET',
    url: `/driver/${driver.id}`
  });

  const body = response.json();

  t.is(response.statusCode, 200, 'Expected 200');
  t.like(body, {
    discordId: driver.discordId,
    firstName: driver.firstName,
    lastName: driver.lastName,
    steamId: driver.steamId
  }, 'Expected response to match database entity');

  t.teardown(async () => {
    await db
      .deleteFrom('leagues')
      .where('id', '=', driver.id)
      .execute();
  });
});

test.todo('PUT - should return a 404 if no driver with the given id exists');

test("PUT - should update a driver's first name", async (t) => {
  const driver = await createDriver({
    discordId: '234',
    firstName: 'Tom',
    lastName: 'Smith',
    steamId: '123'
  });

  driver.firstName = 'Thomas';

  const response = await t.context.server.inject({
    method: 'PUT',
    payload: driver,
    url: `/driver/${driver.id}`
  });

  const body = response.json();

  t.is(response.statusCode, 200, 'Expected 200');
  t.is(body.firstName, driver.firstName, 'Expected updated first name');

  t.teardown(async () => {
    await db
      .deleteFrom('drivers')
      .where('id', '=', driver.id)
      .execute();
  });
});

test("PUT - should update a driver's last name", async (t) => {
  const driver = await createDriver({
    discordId: '234',
    firstName: 'Tom',
    lastName: 'Smith',
    steamId: '123'
  });

  driver.lastName = 'Smythe';

  const response = await t.context.server.inject({
    method: 'PUT',
    payload: driver,
    url: `/driver/${driver.id}`
  });

  const body = response.json();

  t.is(response.statusCode, 200, 'Expected 200');
  t.is(body.lastName, driver.lastName, 'Expected updated last name');

  t.teardown(async () => {
    await db
      .deleteFrom('drivers')
      .where('id', '=', driver.id)
      .execute();
  });
});

test("PUT - should update a driver's steam id", async (t) => {
  const driver = await createDriver({
    discordId: '234',
    firstName: 'Tom',
    lastName: 'Smith',
    steamId: '123'
  });

  driver.steamId = '888';

  const response = await t.context.server.inject({
    method: 'PUT',
    payload: driver,
    url: `/driver/${driver.id}`
  });

  const body = response.json();

  t.is(response.statusCode, 200, 'Expected 200');
  t.is(body.steamId, driver.steamId, 'Expected updated steamId');

  t.teardown(async () => {
    await db
      .deleteFrom('drivers')
      .where('id', '=', driver.id)
      .execute();
  });
});

test("PUT - should update a driver's discord id", async (t) => {
  const driver = await createDriver({
    discordId: '234',
    firstName: 'Tom',
    lastName: 'Smith',
    steamId: '123'
  });

  driver.discordId = '999';

  const response = await t.context.server.inject({
    method: 'PUT',
    payload: driver,
    url: `/driver/${driver.id}`
  });

  const body = response.json();

  t.is(response.statusCode, 200, 'Expected 200');
  t.is(body.discordId, driver.discordId, 'Expected updated steamId');

  t.teardown(async () => {
    await db
      .deleteFrom('drivers')
      .where('id', '=', driver.id)
      .execute();
  });
});

// TODO: add tests for delete

test.after.always(async (t) => {
  t.context.server.close();
  await db.destroy();
});
