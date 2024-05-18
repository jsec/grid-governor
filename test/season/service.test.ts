import {
  describe, expect, onTestFinished
} from 'vitest';

import { createSeason } from '../../src/modules/season/service.js';
import { seasonBuilder } from '../builders/season.builder.js';
import { test } from '../context.js';

describe.only('Season service', () => {
  // TODO: add a valid platform into the builder
  test('should return an error when the provided leagueId is invalid', async () => {
    const season = seasonBuilder.one();
    const result = await createSeason(season);

    expect(result.isErr()).to.be.true;
  });

  // TODO: add a valid league into the builder
  test('should return an error when the provided platformId is invalid', async () => {
    const season = seasonBuilder.one();
    const result = await createSeason(season);

    expect(result.isErr()).to.be.true;
  });

  test('should create a new season', async () => {
    // TODO
  });

  test('should return an error when retrieving a season with an invalid id', async () => {
    // TODO
  });

  test('should return a season by id', async () => {
    // TODO
  });

  test('should return an error when updating a season with an invalid id', async () => {
    // TODO
  });

  test("should update a season's name", async () => {
    // TODO
  });

  test("should update a season's description", async () => {
    // TODO
  });

  test("should update a season's startDate", async () => {
    // TODO
  });

  test("should update a season's end date", async () => {
    // TODO
  });

  test('should return an error when deleting a season with an invalid id', async () => {
    // TODO
  });

  test('should delete an existing season', async () => {
    // TODO
  });
});
