import { styleText } from 'node:util';
import { z } from 'zod';

const levelColors = {
    debug: 'blue',
    error: 'red',
    fatal: 'magenta',
    info: 'green',
    trace: 'gray',
    warn: 'yellow',
} as const;

const logSchema = z.looseObject({
    err: z.object({
        message: z.string(),
        stack: z.string(),
        type: z.string(),
    }).optional(),
    level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']),
    msg: z.string(),
    release: z.string(),
    service: z.string(),
    time: z.iso.datetime(),
});

const logLine = z.string()
    .transform(text => JSON.parse(text))
    .pipe(logSchema);

export const prettyLog = (raw: string) => {
    const {
        err,
        level,
        msg,
        release,
        service,
        time,
        ...fields
    } = logLine.parse(raw);

    const timestamp = Temporal.Instant.from(time)
        .toZonedDateTimeISO(Temporal.Now.timeZoneId())
        .toPlainTime()
        .toString({ smallestUnit: 'second' });

    const label = styleText(levelColors[level], level.toUpperCase().padEnd(5));
    const pairs = Object.entries(fields).map(([key, value]) => `${key}=${formatValue(value)}`);

    const lines = [[timestamp, label, msg, ...pairs].join(' ')];

    if (err) {
        lines.push(...err.stack.split('\n').map(line => `  ${line}`));
    }

    return lines.join('\n');
};

function formatValue(value: unknown): string {
    if (typeof value === 'string' && !value.includes(' ')) {
        return value;
    }

    return JSON.stringify(value);
}
