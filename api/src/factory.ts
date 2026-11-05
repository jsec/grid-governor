import { createFactory } from 'hono/factory';

import type { SessionEnv } from './middleware/session.ts';

export const factory = createFactory<SessionEnv>();
