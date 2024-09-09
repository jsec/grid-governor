import { StatusCodes } from 'http-status-codes';
import { describe, expect } from 'vitest';

import { createLeague } from '../../src/modules/league/service.js';
import { leagueBuilder } from '../builders/league.builder.js';
import { test } from '../context.js';

describe('League API', () => {
  describe('POST', () => {
    test('should return a 400 when the name is not provided', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          description: 'desc'
        },
        url: '/league'
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
        url: '/league'
      });

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
    });

    test('should create a new league', async ({ app, db }) => {
      const payload = leagueBuilder.one();

      const response = await app.inject({
        method: 'POST',
        payload,
        url: '/league'
      });

      const body = response.json();

      expect(response.statusCode).toEqual(StatusCodes.CREATED);
      expect(body.id).to.not.be.null;
      expect(body.name).to.equal(payload.name);
      expect(body.description).to.equal(payload.description);

      await db
        .deleteFrom('leagues')
        .where('id', '=', body.id)
        .execute();
    });
  });

  describe('GET', () => {
    test('GET - should return a 404 if no league with the given id exists', async ({ app }) => {
      const response = await app.inject({
        method: 'GET',
        url: '/league/999999'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      expect(body.message).to.equal('no result');
    });

    test('should return a league by id', async ({ app, db }) => {
      const leagueResult = await createLeague(leagueBuilder.one());
      const league = leagueResult._unsafeUnwrap();

      const response = await app.inject({
        method: 'GET',
        url: `/league/${league.id}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body.id).to.equal(league.id);
      expect(body.name).to.equal(league.name);
      expect(body.description).to.equal(league.description);

      await db
        .deleteFrom('leagues')
        .where('id', '=', body.id)
        .execute();
    });
  });

  describe('PUT', () => {
    test('should return a 404 if no league with the given id exists', async ({ app }) => {
      const response = await app.inject({
        method: 'PUT',
        payload: leagueBuilder.one(),
        url: '/league/999999'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      expect(body.message).to.equal('no result');
    });

    test('should update a league name', async ({ app, db }) => {
      const leagueResult = await createLeague(leagueBuilder.one());
      const league = leagueResult._unsafeUnwrap();

      league.name = 'Updated name';

      const response = await app.inject({
        method: 'PUT',
        payload: league,
        url: `/league/${league.id}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body.id).to.equal(league.id);
      expect(body.name).to.equal(league.name);

      await db
        .deleteFrom('leagues')
        .where('id', '=', body.id)
        .execute();
    });

    test('should update a league description', async ({ app, db }) => {
      const leagueResult = await createLeague(leagueBuilder.one());
      const league = leagueResult._unsafeUnwrap();

      league.description = 'Updated description';

      const response = await app.inject({
        method: 'PUT',
        payload: league,
        url: `/league/${league.id}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body.id).to.equal(league.id);
      expect(body.description).to.equal(league.description);

      await db
        .deleteFrom('leagues')
        .where('id', '=', body.id)
        .execute();
    });
  });

  describe('DELETE', () => {
    test('should return a 404 if no league with the given id exists', async ({ app }) => {
      const leagueId = 999_999;

      const response = await app.inject({
        method: 'DELETE',
        url: `/league/${leagueId}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      expect(body.message).to.equal(`League with id ${leagueId} was not found`);
    });

    test('should delete an existing league', async ({ app }) => {
      const leagueResult = await createLeague(leagueBuilder.one());

      const { id: leagueId } = leagueResult._unsafeUnwrap();

      const response = await app.inject({
        method: 'DELETE',
        url: `/league/${leagueId}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body).toMatchObject({
        status: 'OK'
      });
    });
  });
});
