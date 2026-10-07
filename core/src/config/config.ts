import { z } from 'zod';

export const envSchema = z.object({
    APP_RELEASE: z.string()
        .regex(/^[0-9a-f]{7}$/)
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
});

export type Config = z.output<typeof envSchema>;

export const loadConfig = () => envSchema.parse(process.env);
