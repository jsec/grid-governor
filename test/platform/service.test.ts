import {
  describe, expect
} from 'vitest';

import {
  createPlatform, deletePlatform, getPlatformById, updatePlatform
} from '../../src/modules/platform/service.js';
import { ErrorCode } from '../../src/types/errors/app.error.js';
import { platformBuilder } from '../builders/platform.builder.js';
import { test } from '../context.js';

describe('Platform service', () => {
  test('should create a new platform', async ({ db }) => {
    const newPlatform = platformBuilder.one();
    const platformResult = await createPlatform(newPlatform);
    const platform = platformResult._unsafeUnwrap();

    expect(platform.name).to.equal(newPlatform.name);
    expect(platform.id).to.not.be.null;

    await db
      .deleteFrom('platforms')
      .where('id', '=', platform.id)
      .execute();
  });

  test('should return an error when retrieving a platform with an invalid id', async () => {
    const result = await getPlatformById(999_999);

    const error = result._unsafeUnwrapErr();
    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.equal('no result');
  });

  test('should return a platform by id', async ({ db }) => {
    const platformResult = await createPlatform(platformBuilder.one());
    const existing = platformResult._unsafeUnwrap();

    const result = await getPlatformById(existing.id);
    const driver = result._unsafeUnwrap();

    expect(driver).toMatchObject(existing);

    await db
      .deleteFrom('platforms')
      .where('id', '=', existing.id)
      .execute();
  });

  test('should update an existing platform', async ({ db }) => {
    const createResult = await createPlatform(platformBuilder.one());
    const existing = createResult._unsafeUnwrap();
    existing.name = 'updated name';

    const updateResult = await updatePlatform(existing.id, existing);
    const updated = updateResult._unsafeUnwrap();

    expect(updated.name).to.equal(existing.name);

    await db
      .deleteFrom('platforms')
      .where('id', '=', existing.id)
      .execute();
  });

  test('should return an error when deleting a platform with an invalid id', async () => {
    const result = await deletePlatform(999_999);
    const error = result._unsafeUnwrapErr();

    expect(error.code).to.equal(ErrorCode.NOT_FOUND);
    expect(error.message).to.include('Platform with id 999999 was not found');
  });

  test('should delete an existing platform', async () => {
    const result = await createPlatform(platformBuilder.one());
    const { id: platformId } = result._unsafeUnwrap();

    const deleteResult = await deletePlatform(platformId);
    const { numDeletedRows } = deleteResult._unsafeUnwrap();

    expect(Number(numDeletedRows)).to.equal(1);
  });
});
