import { z } from 'zod';

const pathSchema = z.array(z.number().or(z.string()));

const issueSchema = z.object({
    message: z.string(),
    path: pathSchema,
});

export const errorBodySchema = z.object({
    error: z.string(),
    issues: z.array(issueSchema).default([]),
});
