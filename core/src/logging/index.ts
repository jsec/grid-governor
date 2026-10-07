import pino from 'pino';

import type { Config } from '../config/config.ts';

import { prettify } from './tty.ts';

type LogDestination = pino.DestinationStream & { isTTY?: boolean };

type LoggerConfig = {
    config: Pick<Config, 'APP_RELEASE' | 'LOG_LEVEL'>;
    destination: LogDestination;
    service: string;
};

export const createLogger = ({ config, destination, service }: LoggerConfig) => {
    const output: pino.DestinationStream = destination.isTTY
        ? { write: line => destination.write(`${prettify(line)}\n`) }
        : destination;

    return pino(
        {
            base: {
                release: config.APP_RELEASE,
                service,
            },
            formatters: {
                level: label => ({ level: label }),
            },
            level: config.LOG_LEVEL,
            timestamp: pino.stdTimeFunctions.isoTime,
        },
        output,
    );
};
