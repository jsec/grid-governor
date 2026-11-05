import type { leagueRolesSchema } from '@grid-governor/core/schemas';
import type { z } from 'zod';

import { leagueRoles } from '@grid-governor/core/access';

type LeaguePermissions = Parameters<typeof leagueRoles.manager.authorize>[0];

export function hasLeaguePermission(
    roles: z.infer<typeof leagueRolesSchema>,
    permissions: LeaguePermissions,
) {
    if (roles.organizationRole !== 'member') {
        return true;
    }

    return roles.leagueRoles.some((role) => {
        const authorization = leagueRoles[role].authorize(permissions);

        return authorization.success;
    });
}
