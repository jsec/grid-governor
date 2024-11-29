import { faker } from '@faker-js/faker';
import { build, perBuild } from '@jackfranklin/test-data-bot';

export const driverBuilder = build('driver', {
  fields: {
    discordId: perBuild(() => faker.number.hex()),
    firstName: perBuild(() => faker.person.firstName()),
    lastName: perBuild(() => faker.person.lastName()),
    steamId: perBuild(() => faker.number.hex()),
  },
});

export const driverRecordBuilder = build('driverRecord', {
  fields: {
    createdAt: perBuild(() => new Date().toISOString()),
    discordId: perBuild(() => faker.number.hex()),
    firstName: perBuild(() => faker.person.firstName()),
    id: perBuild(() => faker.number.int()),
    lastName: perBuild(() => faker.person.lastName()),
    steamId: perBuild(() => faker.number.hex()),
    updatedAt: perBuild(() => new Date().toISOString()),
  },
});
