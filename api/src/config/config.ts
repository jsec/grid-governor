import { z } from 'zod';

const envSchema = z.object({
    API_PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    DATABASE_URL: z.url(),
});

export type Config = {
    apiPort: number;
    betterAuthSecret: string;
    betterAuthUrl: string;
    databaseUrl: string;
};

export const loadConfig = (environment: NodeJS.ProcessEnv = process.env): Config => {
    const env = envSchema.parse(environment);

    return {
        apiPort: env.API_PORT,
        betterAuthSecret: env.BETTER_AUTH_SECRET,
        betterAuthUrl: env.BETTER_AUTH_URL,
        databaseUrl: env.DATABASE_URL,
    };
};
