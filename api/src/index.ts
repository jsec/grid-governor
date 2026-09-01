import { serve } from '@hono/node-server';

import { app } from './app.js';

// Number.parseInt intentionally accepts a numeric prefix in PORT values.
// eslint-disable-next-line unicorn/prefer-number-coercion
const port = Number.parseInt(process.env.PORT ?? '3000', 10);

serve({ fetch: app.fetch, port });
