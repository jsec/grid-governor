import type { FastifyInstance } from 'fastify';

import anyTest, { type TestFn } from 'ava';

import { createApp } from '../../src/app.js';
import { db } from '../../src/db/conn.js';
import { createLeague } from '../../src/modules/league/service.js';

const test = anyTest as TestFn<{ server: FastifyInstance }>;

test.before((t) => {
  t.context.server = createApp();
});

test('POST - should return a 400 when the league name is not provided', async (t) => {
  const response = await t.context.server.inject({
    method: 'POST',
    payload: {
      description: 'description'
    },
    url: '/league'
  });

  t.is(response.statusCode, 400, 'Expected 400');
  t.is(response.statusMessage, 'Bad Request', 'Expected Bad Request');
});

test('POST - should return a 400 when the league description is not provided', async (t) => {
  const response = await t.context.server.inject({
    method: 'POST',
    payload: {
      name: 'name'
    },
    url: '/league'
  });

  t.is(response.statusCode, 400, 'Expected 400');
  t.is(response.statusMessage, 'Bad Request', 'Expected Bad Request');
});

test('POST - should create a new league', async (t) => {
  const payload = {
    description: 'test league description',
    name: 'test league name'
  };

  const response = await t.context.server.inject({
    method: 'POST',
    payload,
    url: '/league'
  });

  const body = response.json();

  t.is(response.statusCode, 201, 'Expected 201');
  t.like(body, payload);

  t.teardown(async () => {
    await db
      .deleteFrom('leagues')
      .where('id', '=', body.id)
      .execute();
  });
});

test.todo('GET - should return a 404 if no league with the given id exists');

test('GET - should return a league by id', async (t) => {
  const league = await createLeague({
    description: 'Some words',
    name: 'Test League - Get'
  });

  const response = await t.context.server.inject({
    method: 'GET',
    url: `/league/${league.id}`
  });

  const body = response.json();

  t.is(response.statusCode, 200, 'Expected 200');
  t.like(body, {
    description: league.description,
    id: league.id,
    name: league.name
  }, 'Expected response to match database entity');

  t.teardown(async () => {
    await db
      .deleteFrom('leagues')
      .where('id', '=', league.id)
      .execute();
  });
});

test.todo('PUT - should return a 404 if no platform with the given id exists');

test('PUT - should update a league name', async (t) => {
  const league = await createLeague({
    description: 'Desc',
    name: 'Name'
  });

  league.name = 'Updated name';

  const response = await t.context.server.inject({
    method: 'PUT',
    payload: league,
    url: `/league/${league.id}`
  });

  const body = response.json();

  t.is(response.statusCode, 200, 'Expected 200');
  t.is(body.name, league.name, 'Expected updated league name');

  t.teardown(async () => {
    await db
      .deleteFrom('leagues')
      .where('id', '=', league.id)
      .execute();
  });
});

test('PUT - should update a league description', async (t) => {
  const league = await createLeague({
    description: 'Desc',
    name: 'Name'
  });

  league.description = 'Updated description';

  const response = await t.context.server.inject({
    method: 'PUT',
    payload: league,
    url: `/league/${league.id}`
  });

  const body = response.json();

  t.is(response.statusCode, 200, 'Expected 200');
  t.is(body.description, league.description, 'Expected updated league description');

  t.teardown(async () => {
    await db
      .deleteFrom('leagues')
      .where('id', '=', league.id)
      .execute();
  });
});

// TODO: add tests for delete

test.after.always(async (t) => {
  t.context.server.close();
  await db.destroy();
});
