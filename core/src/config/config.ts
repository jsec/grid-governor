import { z } from 'zod';

export const envSchema = z.object({
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    DATABASE_URL: z.url(),
});

const configSchema = envSchema.transform(env => ({
    betterAuthSecret: env.BETTER_AUTH_SECRET,
    betterAuthUrl: env.BETTER_AUTH_URL,
    databaseUrl: env.DATABASE_URL,
}));

export type Config = z.output<typeof configSchema>;

export const loadConfig = () => configSchema.parse(process.env);
