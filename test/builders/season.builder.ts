import { faker } from '@faker-js/faker';
import { build, perBuild } from '@jackfranklin/test-data-bot';

export const seasonBuilder = build('season', {
  fields: {
    description: perBuild(() => faker.company.catchPhrase()),
    endDate: perBuild(() => new Date().toISOString()),
    leagueId: perBuild(() => 3),
    name: perBuild(() => faker.company.name()),
    platformId: perBuild(() => 4),
    startDate: perBuild(() => new Date().toISOString()),
  },
});

export const seasonRecordBuilder = build('season', {
  fields: {
    createdAt: perBuild(() => new Date().toISOString()),
    description: perBuild(() => faker.company.catchPhrase()),
    endDate: perBuild(() => new Date().toISOString()),
    id: perBuild(() => faker.number.int()),
    leagueId: perBuild(() => 3),
    name: perBuild(() => faker.company.name()),
    platformId: perBuild(() => 4),
    startDate: perBuild(() => new Date().toISOString()),
    updatedAt: perBuild(() => new Date().toISOString()),
  },
});
