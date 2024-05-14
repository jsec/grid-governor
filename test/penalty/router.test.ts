import type { FastifyInstance } from 'fastify';

import anyTest, { type TestFn } from 'ava';

import { createApp } from '../../src/app.js';
import { db } from '../../src/db/conn.js';
import { createPenalty } from '../../src/modules/penalty/service.js';

const test = anyTest as TestFn<{ server: FastifyInstance }>;

test.before((t) => {
  t.context.server = createApp();
});

test('POST - should return a 400 when the penalty name is not provided', async (t) => {
  const response = await t.context.server.inject({
    method: 'POST',
    payload: {
      description: 'description'
    },
    url: '/penalty'
  });

  t.is(response.statusCode, 400, 'Expected 400');
  t.is(response.statusMessage, 'Bad Request', 'Expected Bad Request');
});

test('POST - should return a 400 when the penalty description is not provided', async (t) => {
  const response = await t.context.server.inject({
    method: 'POST',
    payload: {
      name: 'name'
    },
    url: '/penalty'
  });

  t.is(response.statusCode, 400, 'Expected 400');
  t.is(response.statusMessage, 'Bad Request', 'Expected Bad Request');
});

test('POST - should create a new penalty', async (t) => {
  const payload = {
    description: 'test penalty description',
    name: 'test penalty name'
  };

  const response = await t.context.server.inject({
    method: 'POST',
    payload,
    url: '/penalty'
  });

  const body = response.json();

  t.is(response.statusCode, 201, 'Expected 201');
  t.like(body, payload);

  t.teardown(async () => {
    await db
      .deleteFrom('penalties')
      .where('id', '=', body.id)
      .execute();
  });
});

test.todo('GET - should return a 404 if no penalty with the given id exists');

test('GET - should return a penalty by id', async (t) => {
  const penalty = await createPenalty({
    description: 'Some words',
    name: 'Test Penalty - Get'
  });

  const response = await t.context.server.inject({
    method: 'GET',
    url: `/penalty/${penalty.id}`
  });

  const body = response.json();

  t.is(response.statusCode, 200, 'Expected 200');
  t.like(body, {
    description: penalty.description,
    id: penalty.id,
    name: penalty.name
  }, 'Expected response to match database entity');

  t.teardown(async () => {
    await db
      .deleteFrom('penalties')
      .where('id', '=', penalty.id)
      .execute();
  });
});

test.todo('PUT - should return a 404 if no penalty with the given id exists');

test('PUT - should update a penalty name', async (t) => {
  const penalty = await createPenalty({
    description: 'Desc',
    name: 'Name'
  });

  penalty.name = 'Updated name';

  const response = await t.context.server.inject({
    method: 'PUT',
    payload: penalty,
    url: `/penalty/${penalty.id}`
  });

  const body = response.json();

  t.is(response.statusCode, 200, 'Expected 200');
  t.is(body.name, penalty.name, 'Expected updated penalty name');

  t.teardown(async () => {
    await db
      .deleteFrom('penalties')
      .where('id', '=', penalty.id)
      .execute();
  });
});

test('PUT - should update a penalty description', async (t) => {
  const penalty = await createPenalty({
    description: 'Desc',
    name: 'Name'
  });

  penalty.description = 'Updated description';

  const response = await t.context.server.inject({
    method: 'PUT',
    payload: penalty,
    url: `/penalty/${penalty.id}`
  });

  const body = response.json();

  t.is(response.statusCode, 200, 'Expected 200');
  t.is(body.description, penalty.description, 'Expected updated penalty description');

  t.teardown(async () => {
    await db
      .deleteFrom('penalties')
      .where('id', '=', penalty.id)
      .execute();
  });
});

// TODO: add tests for delete

test.after.always(async (t) => {
  t.context.server.close();
  await db.destroy();
});
