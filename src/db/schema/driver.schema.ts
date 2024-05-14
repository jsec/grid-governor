import type {
  Generated, Insertable, Selectable, Updateable
} from 'kysely';

import type { Timestamp } from './schema.types.js';

export interface DriverSchema {
  createdAt: Timestamp,
  discordId: string,
  firstName: string,
  id: Generated<number>,
  lastName: string,
  steamId: string,
  updatedAt: Timestamp,
}

export type Driver = Selectable<DriverSchema>;
export type NewDriver = Insertable<DriverSchema>;
export type DriverUpdate = Updateable<DriverSchema>;
