import {
  Generated, Insertable, Selectable, Updateable
} from 'kysely';

export interface PlatformSchema {
  created_at: Generated<Date>,
  id: Generated<number>,
  name: string,
  updated_at: Generated<Date>,
}

export type Platform = Selectable<PlatformSchema>;
export type NewPlatform = Insertable<PlatformSchema>;
export type PlatformUpdate = Updateable<PlatformSchema>;
