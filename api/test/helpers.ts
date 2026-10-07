import { createLogger } from '@grid-governor/core/logging';

import type { AuthRouteHandler } from '../src/auth/invite-handler.ts';

import { createApp } from '../src/app.ts';

export const createTestLogger = () => {
    const lines: string[] = [];

    const logger = createLogger({
        config: {
            APP_RELEASE: 'a1b2c3d',
            LOG_LEVEL: 'info',
        },
        destination: {
            write: (line: string) => {
                lines.push(line);
            },
        },
        service: 'api',
    });

    return { lines, logger };
};

export const createTestApp = (authHandler: AuthRouteHandler) => {
    const { lines, logger } = createTestLogger();

    return { app: createApp(authHandler, logger), lines };
};
