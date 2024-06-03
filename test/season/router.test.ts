import { StatusCodes } from 'http-status-codes';
import { describe, expect } from 'vitest';

import { createSeason } from '../../src/modules/season/service.js';
import { PostgresErrorCode } from '../../src/types/errors/postgres.error.js';
import { seasonBuilder } from '../builders/season.builder.js';
import { test } from '../context.js';

describe('Season API', () => {
  describe('POST', () => {
    test('should return a 400 when the season name is not provided', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          description: 'A new season',
          endDate: new Date().toISOString(),
          leagueId: 4,
          platformId: 2,
          startDate: new Date().toISOString()
        },
        url: '/season'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.message).to.include("must have required property 'name'");
    });

    test('should return a 400 when the season description is not provided', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          endDate: new Date().toISOString(),
          leagueId: 4,
          name: 'Season',
          platformId: 2,
          startDate: new Date().toISOString()
        },
        url: '/season'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.message).to.include("must have required property 'description'");
      // TODO
    });

    test('should return a 400 when the season start date is not provided', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          description: 'A new season',
          endDate: new Date().toISOString(),
          leagueId: 4,
          name: 'Season',
          platformId: 2
        },
        url: '/season'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.message).to.include("must have required property 'startDate'");
    });

    test('should return a 400 when the season end date is not provided', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          description: 'A new season',
          leagueId: 4,
          name: 'Season',
          platformId: 2,
          startDate: new Date().toISOString()
        },
        url: '/season'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.message).to.include("must have required property 'endDate'");
    });

    test('should return a 400 when no league with supplied leagueId exists', async ({ app }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          description: 'A new season',
          endDate: new Date().toISOString(),
          leagueId: 4,
          name: 'Season',
          platformId: 2,
          startDate: new Date().toISOString(),
        },
        url: '/season'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.name).to.equal(PostgresErrorCode.ForeignKeyViolation);
      expect(body.message).to.include('league_id');
    });

    // eslint-disable-next-line @stylistic/max-len
    test('should return a 400 when no platform with supplied platformId exists', async ({ app, league }) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          description: 'A new season',
          endDate: new Date().toISOString(),
          leagueId: league.id,
          name: 'Season',
          platformId: 2,
          startDate: new Date().toISOString(),
        },
        url: '/season'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.BAD_REQUEST);
      expect(response.statusMessage).to.equal('Bad Request');
      expect(body.name).to.equal(PostgresErrorCode.ForeignKeyViolation);
      expect(body.message).to.include('platform_id');
    });

    test('should create a new season', async ({
      app, db, league, platform
    }) => {
      const season = seasonBuilder.one({
        overrides: {
          leagueId: league.id,
          platformId: platform.id
        }
      });

      const response = await app.inject({
        method: 'POST',
        payload: season,
        url: '/season'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.CREATED);
      expect(body.id).to.not.be.null;
      expect(body).toMatchObject({
        description: season.description,
        leagueId: season.leagueId,
        name: season.name,
        platformId: season.platformId
      });

      await db
        .deleteFrom('seasons')
        .where('id', '=', body.id)
        .execute();
    });
  });

  describe('GET', () => {
    test('should return a 404 if no season with the given id exists', async ({ app }) => {
      const response = await app.inject({
        method: 'GET',
        url: '/season/999999'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      // TODO: this kinda sucks, fix this
      expect(body.message).to.equal('no result');
    });

    test('should return a season by id', async ({
      app, db, league, platform
    }) => {
      const created = await createSeason(seasonBuilder.one({
        overrides: {
          leagueId: league.id,
          platformId: platform.id
        }
      }));

      const season = created._unsafeUnwrap();

      const response = await app.inject({
        method: 'GET',
        url: `/season/${season.id}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body).toMatchObject({
        description: season.description,
        id: season.id,
        leagueId: season.leagueId,
        name: season.name,
        platformId: season.platformId
      });

      await db
        .deleteFrom('seasons')
        .where('id', '=', season.id)
        .execute();
    });
  });

  describe('PUT', () => {
    test('should return a 404 if no season with the given id exists', async ({ app }) => {
      const response = await app.inject({
        method: 'PUT',
        payload: seasonBuilder.one(),
        url: '/season/999999'
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.NOT_FOUND);
      expect(response.statusMessage).to.equal('Not Found');
      // TODO: this kinda sucks, fix this
      expect(body.message).to.equal('no result');
    });

    test("should update a season's name", async ({
      app, db, league, platform,
    }) => {
      const created = await createSeason(seasonBuilder.one({
        overrides: {
          leagueId: league.id,
          platformId: platform.id
        }
      }));

      const existing = created._unsafeUnwrap();
      existing.name = 'Some new name';

      const response = await app.inject({
        method: 'PUT',
        payload: existing,
        url: `/season/${existing.id}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body.name).to.equal(existing.name);

      await db
        .deleteFrom('seasons')
        .where('id', '=', existing.id)
        .execute();
    });

    test("should update a season's description", async ({
      app, db, league, platform
    }) => {
      const created = await createSeason(seasonBuilder.one({
        overrides: {
          leagueId: league.id,
          platformId: platform.id
        }
      }));

      const existing = created._unsafeUnwrap();
      existing.description = 'Some new description';

      const response = await app.inject({
        method: 'PUT',
        payload: existing,
        url: `/season/${existing.id}`
      });

      const body = response.json();

      expect(response.statusCode).to.equal(StatusCodes.OK);
      expect(body.description).to.equal(existing.description);

      await db
        .deleteFrom('seasons')
        .where('id', '=', existing.id)
        .execute();
    });

    // TODO: add tests for startDate and endDate
  });

  // TODO: add delete tests
});
