import dns from 'node:dns';

import { createApp } from './app.js';
import { env } from './shared/env.js';

dns.setDefaultResultOrder('ipv4first');

const app = createApp();

app.listen({ host: env.API_HOST, port: env.API_PORT }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`Server listening at ${address}`);
});
