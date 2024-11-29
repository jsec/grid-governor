import { faker } from '@faker-js/faker';
import {
  build, perBuild, sequence,
} from '@jackfranklin/test-data-bot';

export const platformBuilder = build('platform', {
  fields: {
    name: perBuild(() => faker.internet.domainName()),
  },
});

export const platformRecordBuilder = build('platformRecord', {
  fields: {
    createdAt: perBuild(() => new Date().toISOString()),
    id: sequence(),
    name: perBuild(() => faker.internet.domainName()),
    updatedAt: perBuild(() => new Date().toISOString()),
  },
});
