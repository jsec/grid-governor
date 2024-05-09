export const getLoggerByEnv = {
  development: {
    transport: {
      options: {
        ignore: 'pid,hostname',
        translateTime: 'HH:MM:ss Z',
      },
      target: 'pino-pretty',
    },
  },
  production: true,
  test: false,
};
