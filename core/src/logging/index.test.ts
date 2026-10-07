import { stripVTControlCharacters } from 'node:util';
import { describe, expect, it } from 'vitest';

import { createLogger } from './index.ts';

const config = {
    APP_RELEASE: 'a1b2c3d',
    LOG_LEVEL: 'info',
} as const;

const capture = ({ isTTY }: { isTTY: boolean }) => {
    const lines: string[] = [];

    const destination = {
        isTTY,
        write: (line: string) => { lines.push(line); },
    };

    return { destination, lines };
};

describe('createLogger', () => {
    it('writes structured logs with level, time, message, service, and release', () => {
        const { destination, lines } = capture({ isTTY: false });

        const logger = createLogger({
            config,
            destination,
            service: 'api',
        });

        logger.info({ league_id: '67' }, 'created the league');

        const result = JSON.parse(lines[0]);

        expect(lines).toHaveLength(1);
        expect(result).toEqual({
            league_id: '67',
            level: 'info',
            msg: 'created the league',
            release: config.APP_RELEASE,
            service: 'api',
            time: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        });
    });

    it('skips logs below the configured log level', () => {
        const { destination, lines } = capture({ isTTY: false });

        const logger = createLogger({
            config: {
                ...config,
                LOG_LEVEL: 'warn',
            },
            destination,
            service: 'api',
        });

        logger.error('written');
        logger.info('not written');

        const line = JSON.parse(lines[0]);

        expect(lines).toHaveLength(1);
        expect(line.level).toEqual('error');
    });

    it(`adds a child logger's fields to the log`, () => {
        const { destination, lines } = capture({ isTTY: false });

        const logger = createLogger({
            config,
            destination,
            service: 'api',
        });

        logger.child({ league_id: '67' }).info('updated the league');

        const result = JSON.parse(lines[0]);

        expect(result).toMatchObject({
            league_id: '67',
            msg: 'updated the league',
        });
    });

    it('uses a friendly log format in TTY environments', () => {
        const { destination, lines } = capture({ isTTY: true });

        const logger = createLogger({
            config,
            destination,
            service: 'api',
        });

        logger.info({ league_id: '67' }, 'league created');

        const result = stripVTControlCharacters(lines[0]);

        expect(result).toEqual(
            expect.stringMatching(/^\d{2}:\d{2}:\d{2} INFO {2}league created league_id=67\n$/),
        );
    });

    it('redacts sensitive fields', () => {
        const { destination, lines } = capture({ isTTY: false });

        const logger = createLogger({
            config,
            destination,
            service: 'api',
        });

        logger.info(
            {
                password: 'hunter2',
                req: {
                    headers: {
                        authorization: 'Bearer abc',
                        cookie: 'session=abc',
                    },
                },
                session: {
                    accessToken: 'abc',
                    refreshToken: 'def',
                },
                user: {
                    email: 'member@example.test',
                    id: 'u_3',
                },
            },
            'signed in',
        );

        const result = JSON.parse(lines[0]);

        expect(result).toMatchObject({
            password: '[REDACTED]',
            req: {
                headers: {
                    authorization: '[REDACTED]',
                    cookie: '[REDACTED]',
                },
            },
            session: {
                accessToken: '[REDACTED]',
                refreshToken: '[REDACTED]',
            },
            user: {
                email: '[REDACTED]',
                id: 'u_3',
            },
        });
    });
});
