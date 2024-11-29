import { faker } from '@faker-js/faker';
import { build, perBuild } from '@jackfranklin/test-data-bot';

export const rulingBuilder = build('ruling', {
  fields: {
    incidentId: perBuild(() => faker.number.int({ max: 100_000 })),
    penaltyId: perBuild(() => faker.number.int({ max: 100_000 })),
  },
});

export const rulingRecordBuilder = build('rulingRecord', {
  fields: {
    createdAt: perBuild(() => new Date().toISOString()),
    id: perBuild(() => faker.number.int()),
    incidentId: perBuild(() => faker.number.int({ max: 100_000 })),
    penaltyId: perBuild(() => faker.number.int({ max: 100_000 })),
    updatedAt: perBuild(() => new Date().toISOString()),
  },
});
