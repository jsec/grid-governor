import { z } from 'zod';

export const leagueRoleSchema = z.enum([
    'appeals',
    'manager',
    'steward',
]);

export const leagueMembershipSchema = z.object({
    grantedAt: z.iso.datetime(),
    id: z.string(),
    role: leagueRoleSchema,
    userId: z.string(),
});

export const leagueMembershipListSchema = z.object({
    memberships: z.array(leagueMembershipSchema),
});

export const grantLeagueRoleSchema = z.object({
    role: leagueRoleSchema,
    userId: z.string().min(1),
});
