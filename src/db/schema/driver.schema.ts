import type {
  Generated, Insertable, Selectable, Updateable
} from 'kysely';

export interface DriverSchema {
  createdAt: Generated<Date>,
  discordId: string,
  firstName: string,
  id: Generated<number>,
  lastName: string,
  steamId: string,
  updatedAt: Generated<Date>,
}

export type Driver = Selectable<DriverSchema>;
export type NewDriver = Insertable<DriverSchema>;
export type DriverUpdate = Updateable<DriverSchema>;
