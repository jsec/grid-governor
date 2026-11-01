import { z } from 'zod';

const SHORT_COMMIT_SHA = /^[0-9a-f]{7}$/;

export const envSchema = z.object({
    APP_ENV: z.enum(['development', 'production']).default('development'),
    APP_RELEASE: z.string()
        .regex(SHORT_COMMIT_SHA)
        .default('dev'),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    DATABASE_URL: z.url(),
    LOG_LEVEL: z.enum([
        'trace',
        'debug',
        'info',
        'warn',
        'error',
        'fatal',
    ]).default('info'),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.url().optional(),
});

export type Config = z.output<typeof envSchema>;

export const loadConfig = () => envSchema.parse(process.env);
