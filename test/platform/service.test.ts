import { NoResultError } from 'kysely';
import {
  describe, expect, onTestFinished
} from 'vitest';

import {
  createPlatform, deletePlatform, getPlatformById, updatePlatform
} from '../../src/modules/platform/service.js';
import { test } from '../context.js';
import { platformBuilder } from '../data/platform.builder.js';

describe('Platform service', () => {
  test('should create a new platform', async ({ db }) => {
    const platform = platformBuilder.one();
    const result = await createPlatform(platform);

    expect(result.name).to.equal(platform.name);
    expect(result.id).to.not.be.null;

    onTestFinished(async () => {
      await db
        .deleteFrom('platforms')
        .where('id', '=', result.id)
        .execute();
    });
  });

  test('should return a platform by id', async ({ db }) => {
    const existing = await createPlatform({
      name: 'existing platform'
    });

    const result = await getPlatformById(existing.id);

    expect(result.id).to.equal(existing.id);
    expect(result.name).to.equal(existing.name);

    onTestFinished(async () => {
      await db
        .deleteFrom('platforms')
        .where('id', '=', result.id)
        .execute();
    });
  });

  test('should return a NoResultError when a platform is not found by id', async () => {
    await expect(getPlatformById(999_999)).rejects.toThrow(NoResultError);
  });

  test('should update an existing platform', async ({ db }) => {
    const existing = await createPlatform(platformBuilder.one());
    existing.name = 'updated name';

    const result = await updatePlatform(existing.id, existing);
    expect(result.name).to.equal(existing.name);

    onTestFinished(async () => {
      await db
        .deleteFrom('platforms')
        .where('id', '=', result.id)
        .execute();
    });
  });

  test('should delete an existing platform', async ({ db }) => {
    const existing = await createPlatform(platformBuilder.one());

    const result = await deletePlatform(existing.id);

    expect(Number(result.numDeletedRows)).to.equal(1);

    onTestFinished(async () => {
      await db
        .deleteFrom('platforms')
        .where('id', '=', existing.id)
        .execute();
    });
  });

  test('should return 0 rows deleted when the platform is not found by id', async () => {
    const result = await deletePlatform(999_999);

    expect(Number(result.numDeletedRows)).to.equal(0);
  });
});
