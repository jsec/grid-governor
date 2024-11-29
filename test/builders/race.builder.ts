import { faker } from '@faker-js/faker';
import { build, perBuild } from '@jackfranklin/test-data-bot';

export const raceBuilder = build('season', {
  fields: {
    leagueId: perBuild(() => 3),
    name: perBuild(() => faker.company.name()),
    seasonId: perBuild(() => 4),
    time: perBuild(() => new Date().toISOString()),
    week: perBuild(() => faker.number.int({ max: 100_000 })),
  },
});

export const raceRecordBuilder = build('season', {
  fields: {
    createdAt: perBuild(() => new Date().toISOString()),
    id: perBuild(() => faker.number.int()),
    leagueId: perBuild(() => 3),
    name: perBuild(() => faker.company.name()),
    seasonId: perBuild(() => 4),
    time: perBuild(() => new Date().toISOString()),
    updatedAt: perBuild(() => new Date().toISOString()),
    week: perBuild(() => faker.number.int({ max: 100_000 })),
  },
});
