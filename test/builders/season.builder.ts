import { faker } from '@faker-js/faker';
import { build, perBuild } from '@jackfranklin/test-data-bot';

export const seasonBuilder = build('season', {
  fields: {
    description: perBuild(() => faker.company.catchPhrase()),
    endDate: perBuild(() => new Date()),
    leagueId: perBuild(() => 3),
    name: perBuild(() => faker.company.name()),
    platformId: perBuild(() => 4),
    startDate: perBuild(() => new Date())
  }
});

export const seasonRecordBuilder = build('season', {
  fields: {
    createdAt: perBuild(() => new Date().toISOString()),
    description: perBuild(() => faker.company.catchPhrase()),
    endDate: perBuild(() => new Date()),
    leagueId: perBuild(() => 3),
    name: perBuild(() => faker.company.name()),
    platformId: perBuild(() => 4),
    startDate: perBuild(() => new Date()),
    updatedAt: perBuild(() => new Date().toISOString())
  }
});
