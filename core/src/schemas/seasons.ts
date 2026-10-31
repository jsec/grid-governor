import { z } from 'zod';

const nonNegativeIntSchema = z.number()
    .int()
    .nonnegative();

export const seasonSchema = z.object({
    createdAt: z.iso.datetime(),
    dropWorst: z.number().int(),
    expiryRounds: z.number()
        .int()
        .nullable(),
    fastestLapBonus: z.number().int(),
    hasResults: z.boolean(),
    id: z.string(),
    leagueId: z.string(),
    name: z.string(),
    pointsScheme: z.array(z.number().int()),
    poleBonus: z.number().int(),
});

export const seasonListSchema = z.object({
    seasons: z.array(seasonSchema),
});

export const seasonInputSchema = z.object({
    dropWorst: nonNegativeIntSchema,
    expiryRounds: z.number()
        .int()
        .positive()
        .nullable(),
    fastestLapBonus: nonNegativeIntSchema,
    name: z.string()
        .trim()
        .min(1),
    pointsScheme: z.array(nonNegativeIntSchema).min(1),
    poleBonus: nonNegativeIntSchema,
});
