import type {
  Generated, Insertable, Selectable, Updateable
} from 'kysely';

import type { Timestamp } from './schema.types.js';

export interface RegistrationSchema {
  createdAt: Timestamp,
  driverId: number,
  id: Generated<number>,
  seasonId: number,
  updatedAt: Timestamp,
}

export type Registration = Selectable<RegistrationSchema>;
export type NewRegistration = Insertable<RegistrationSchema>;
export type RegistrationUpdate = Updateable<RegistrationSchema>;
