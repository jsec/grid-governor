import type {
  Generated, Insertable, Selectable, Updateable
} from 'kysely';

import type { Timestamp } from './schema.types.js';

export interface PlatformSchema {
  createdAt: Timestamp,
  id: Generated<number>,
  name: string,
  updatedAt: Timestamp,
}

export type Platform = Selectable<PlatformSchema>;
export type NewPlatform = Insertable<PlatformSchema>;
export type PlatformUpdate = Updateable<PlatformSchema>;
