import { faker } from '@faker-js/faker';
import { build, perBuild } from '@jackfranklin/test-data-bot';

export const registrationBuilder = build('registration', {
  fields: {
    driverId: perBuild(() => faker.number.int({ max: 100_000 })),
    seasonId: perBuild(() => faker.number.int({ max: 100_000 })),
  },
});

export const registrationRecordBuilder = build('registration', {
  fields: {
    createdAt: perBuild(() => new Date().toISOString()),
    driverId: perBuild(() => faker.number.int({ max: 100_000 })),
    id: perBuild(() => faker.number.int({ max: 100_000 })),
    seasonId: perBuild(() => faker.number.int({ max: 100_000 })),
    updatedAt: perBuild(() => new Date().toISOString()),
  },
});
