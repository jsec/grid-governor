import { faker } from '@faker-js/faker';
import { build, perBuild } from '@jackfranklin/test-data-bot';

export const penaltyBuilder = build('penalty', {
  fields: {
    description: perBuild(() => faker.word.adjective()),
    name: perBuild(() => faker.word.noun())
  }
});

export const penaltyRecordBuilder = build('penaltyRecord', {
  fields: {
    createdAt: perBuild(() => new Date().toISOString()),
    description: perBuild(() => faker.company.catchPhrase()),
    name: perBuild(() => faker.company.name()),
    updatedAt: perBuild(() => new Date().toISOString())
  }
});
