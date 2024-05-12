import type {
  Generated, Insertable, Selectable, Updateable
} from 'kysely';

export interface PlatformSchema {
  createdAt: Generated<Date>,
  id: Generated<number>,
  name: string,
  updatedAt: Generated<Date>,
}

export type Platform = Selectable<PlatformSchema>;
export type NewPlatform = Insertable<PlatformSchema>;
export type PlatformUpdate = Updateable<PlatformSchema>;
