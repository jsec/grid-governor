import { z } from 'zod';

const apiConfigSchema = z.object({
    API_PORT: z.coerce
        .number()
        .int()
        .min(1)
        .max(65_535)
        .default(3000),
    INVITATION_FROM_EMAIL: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    WEB_URL: z.url(),
});

export type ApiConfig = z.output<typeof apiConfigSchema>;

export const loadApiConfig = () => apiConfigSchema.parse(process.env);
