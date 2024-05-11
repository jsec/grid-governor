import { LeagueSchema } from './league.schema';
import { PlatformSchema } from './platform.schema';

export interface Database {
  leagues: LeagueSchema,
  platforms: PlatformSchema,
}
