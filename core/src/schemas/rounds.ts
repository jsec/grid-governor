import { z } from 'zod';

export const roundSchema = z.object({
    createdAt: z.iso.datetime(),
    id: z.string(),
    ordinal: z.number().int(),
    seasonId: z.string(),
    startsAt: z.iso.datetime().nullable(),
    track: z.string(),
});

export const roundListSchema = z.object({
    rounds: z.array(roundSchema),
});

export const roundInputSchema = z.object({
    startsAt: z.iso
        .datetime({ offset: true })
        .transform(value => new Date(value))
        .nullable(),
    track: z.string()
        .trim()
        .min(1),
});
