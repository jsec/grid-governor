import type {
  Generated, Insertable, Selectable, Updateable
} from 'kysely';

export interface RegistrationSchema {
  createdAt: Generated<Date>,
  driverId: number,
  id: Generated<number>,
  seasonId: number,
  updatedAt: Generated<Date>,
}

export type Registration = Selectable<RegistrationSchema>;
export type NewRegistration = Insertable<RegistrationSchema>;
export type RegistrationUpdate = Updateable<RegistrationSchema>;
