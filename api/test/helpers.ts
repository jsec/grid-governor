import { createLogger } from '@grid-governor/core/logging';

import { createApp } from '../src/app.ts';

export const createTestApp = (status: number) => {
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

    return { app: createApp(async () => new Response(null, { status }), logger), lines };
};
