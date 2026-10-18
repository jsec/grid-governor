import { z } from 'zod';

export const leagueSchema = z.object({
    banLengthRounds: z.number()
        .int()
        .nullable(),
    createdAt: z.iso.datetime(),
    id: z.string(),
    name: z.string(),
    organizationId: z.string(),
    rulingSlaHours: z.number().int(),
    suspensionThresholdPoints: z.number()
        .int()
        .nullable(),
});

export const leagueListSchema = z.object({
    leagues: z.array(leagueSchema),
});

export const createLeagueSchema = z.object({
    banLengthRounds: z.number().int()
        .positive()
        .nullable()
        .optional(),
    name: z.string()
        .trim()
        .min(1),
    rulingSlaHours: z.number().int()
        .positive()
        .optional(),
    suspensionThresholdPoints: z.number().int()
        .positive()
        .nullable()
        .optional(),
});

export const updateLeagueSchema = createLeagueSchema.required();
