import { faker } from '@faker-js/faker';
import { build, perBuild } from '@jackfranklin/test-data-bot';

export const leagueBuilder = build('league', {
  fields: {
    description: perBuild(() => faker.company.catchPhrase()),
    name: perBuild(() => faker.company.name())
  }
});

export const leagueRecordBuilder = build('leagueRecord', {
  fields: {
    createdAt: perBuild(() => new Date().toISOString()),
    description: perBuild(() => faker.company.catchPhrase()),
    id: perBuild(() => faker.number.int()),
    name: perBuild(() => faker.company.name()),
    updatedAt: perBuild(() => new Date().toISOString())
  }
});
