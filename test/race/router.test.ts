import { StatusCodes } from 'http-status-codes';
import { describe, expect } from 'vitest';

import { createRace } from '../../src/modules/race/service.js';
import { PostgresErrorCode } from '../../src/types/errors/postgres.error.js';
import { raceBuilder } from '../builders/race.builder.js';
import { test } from '../context.js';

describe('Race API', () => {
  describe('POST', () => {
    test('should return a 400 when no leagueId is supplied', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          name: 'Race',
          seasonId: 12,
          time: new Date().toISOString(),
          week: 4,
        },
        url: '/race',
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.message).to.include('must have required property \'leagueId\'');
    });

    test('should return a 400 when no seasonId is supplied', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          leagueId: 12,
          name: 'Race',
          time: new Date().toISOString(),
          week: 4,
        },
        url: '/race',
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.message).to.include('must have required property \'seasonId\'');
    });

    test('should return a 400 when no name is supplied', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          leagueId: 12,
          seasonId: 1,
          time: new Date().toISOString(),
          week: 4,
        },
        url: '/race',
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.message).to.include('must have required property \'name\'');
    });

    test('should return a 400 when no week is supplied', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          leagueId: 12,
          name: 'Race',
          seasonId: 1,
          time: new Date().toISOString(),
        },
        url: '/race',
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.message).to.include('must have required property \'week\'');
    });

    test('should return a 400 when the leagueId is invalid', async ({ app, season }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          leagueId: 12,
          name: 'Race',
          seasonId: season.id,
          time: new Date().toISOString(),
          week: 4,
        },
        url: '/race',
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.name).to.equal(PostgresErrorCode.ForeignKeyViolation);
      expect(body.message).to.include('league_id');
    });

    test('should return a 400 when the seasonId is invalid', async ({ app, league }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          leagueId: league.id,
          name: 'Race',
          seasonId: 9999,
          time: new Date().toISOString(),
          week: 4,
        },
        url: '/race',
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.name).to.equal(PostgresErrorCode.ForeignKeyViolation);
      expect(body.message).to.include('season_id');
    });

    test('should create a new race', async ({
      app, db, league, season,
    }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          leagueId: league.id,
          name: 'New race',
          seasonId: season.id,
          time: new Date().toISOString(),
          week: 4,
        },
        url: '/race',
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.CREATED);
      expect(body.id).not.to.be.null;
      expect(body).to.include({
        leagueId: league.id,
        name: 'New race',
        seasonId: season.id,
        week: 4,
      });

      await db
        .deleteFrom('races')
        .where('id', '=', body.id)
        .execute();
    });
  });

  describe('GET', () => {
    test('should return a 404 if no race with the given id exists', async ({ app }) => {
      const response = await app.inject({
        method: 'GET',
        url: '/race/999999',
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      expect(body.message).to.equal('no result');
    });

    test('should return a race by id', async ({
      app, db, league, season,
    }) => {
      const raceResult = await createRace(raceBuilder.one({
        overrides: {
          leagueId: league.id,
          seasonId: season.id,
        },
      }));

      const race = raceResult._unsafeUnwrap();

      const response = await app.inject({
        method: 'GET',
        url: `/race/${race.id}`,
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body).to.include({
        id: race.id,
        leagueId: race.leagueId,
        seasonId: race.seasonId,
        week: race.week,
      });

      await db
        .deleteFrom('races')
        .where('id', '=', body.id)
        .execute();
    });
  });

  describe('PUT', () => {
    test('should return a 404 if no race with the given id exists', async ({ app }) => {
      const response = await app.inject({
        method: 'PUT',
        payload: raceBuilder.one(),
        url: '/race/999999',
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      expect(body.message).to.equal('no result');
    });
  });

  describe('DELETE', () => {
    test('should return a 404 if no season with the given id exists', async ({ app }) => {
      const seasonId = 999_999;

      const response = await app.inject({
        method: 'DELETE',
        url: `/season/${seasonId}`,
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      expect(body.message).to.equal(`Season with id ${seasonId} was not found`);
    });

    test('should delete an existing race', async ({
      app, league, season,
    }) => {
      const raceResult = await createRace(raceBuilder.one({
        overrides: {
          leagueId: league.id,
          seasonId: season.id,
        },
      }));

      const { id: raceId } = raceResult._unsafeUnwrap();

      const response = await app.inject({
        method: 'DELETE',
        url: `/race/${raceId}`,
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body).toMatchObject({
        status: 'OK',
      });
    });
  });
});
