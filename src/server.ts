import closeWithGrace, { type CloseWithGraceAsyncCallback } from 'close-with-grace';

import { createApp } from './app.js';
import { env } from './common/env.js';

const app = createApp();

const shutdownCallback: CloseWithGraceAsyncCallback = async ({
  err, manual, signal,
}) => {
  if (err) {
    app.log.error({
      err, manual, signal,
    }, 'error in graceful shutdown listeners');
  }

  await app.close();
  app.log.info({
    err, manual, signal,
  }, 'server process shutdown');
};

const shutdownListener = closeWithGrace({ delay: 500 }, shutdownCallback);

app.addHook('onClose', (_instance, done) => {
  shutdownListener.uninstall();
  done();
});

app.listen({ host: env.API_HOST, port: env.API_PORT }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`Server listening at ${address}`);
});
