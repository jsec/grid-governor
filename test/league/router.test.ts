import type { FastifyInstance } from 'fastify';

import anyTest, { type TestFn } from 'ava';

import { createApp } from '../../src/app.js';
import { db } from '../../src/db/conn.js';

const test = anyTest as TestFn<{ server: FastifyInstance }>;

test.before((t) => {
  t.context.server = createApp();
});

test('should return a 400 when the league name is not provided', async (t) => {
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

test('should return a 400 when the league description is not provided', async (t) => {
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

test('should create a new league', async (t) => {
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

test.after.always(async (t) => {
  t.context.server.close();
  await db.destroy();
});
