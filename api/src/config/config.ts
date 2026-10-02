import { z } from 'zod';

export const envSchema = z.object({
    API_PORT: z.coerce
        .number()
        .int()
        .min(1)
        .max(65_535)
        .default(3000),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    DATABASE_URL: z.url(),
    INVITATION_FROM_EMAIL: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    WEB_URL: z.url(),
});

const configSchema = envSchema.transform(env => ({
    apiPort: env.API_PORT,
    betterAuthSecret: env.BETTER_AUTH_SECRET,
    betterAuthUrl: env.BETTER_AUTH_URL,
    databaseUrl: env.DATABASE_URL,
    invitationFromEmail: env.INVITATION_FROM_EMAIL,
    resendApiKey: env.RESEND_API_KEY,
    webUrl: env.WEB_URL,
}));

export type Config = z.output<typeof configSchema>;

export const loadConfig = () => configSchema.parse(process.env);
