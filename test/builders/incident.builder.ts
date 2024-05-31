import { faker } from '@faker-js/faker';
import { build, perBuild } from '@jackfranklin/test-data-bot';

export const incidentBuilder = build('incident', {
  fields: {
    description: perBuild(() => faker.company.catchPhrase()),
    driverId: perBuild(() => faker.number.int({ max: 100_000 })),
    lapNumber: perBuild(() => faker.number.int({ max: 100 })),
    raceId: perBuild(() => faker.number.int({ max: 100_000 })),
    reportingDriverId: perBuild(() => faker.number.int({ max: 100_000 })),
  }
});

export const incidentRecordBuilder = build('incidentRecord', {
  fields: {
    createdAt: perBuild(() => new Date().toISOString()),
    description: perBuild(() => faker.company.catchPhrase()),
    driverId: perBuild(() => faker.number.int({ max: 100_000 })),
    id: perBuild(() => faker.number.int()),
    lapNumber: perBuild(() => faker.number.int({ max: 100 })),
    raceId: perBuild(() => faker.number.int({ max: 100_000 })),
    reportingDriverId: perBuild(() => faker.number.int({ max: 100_000 })),
    updatedAt: perBuild(() => new Date().toISOString()),
  }
});
