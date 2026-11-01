import type { leagueRolesSchema } from '@grid-governor/core/schemas';
import type { z } from 'zod';

import { leagueAccessControl, leagueRoles } from '@grid-governor/core/access';

export function hasSeasonPermission(
    roles: z.infer<typeof leagueRolesSchema>,
    action: (typeof leagueAccessControl.statements.season)[number],
) {
    if (roles.organizationRole !== 'member') {
        return true;
    }

    return roles.leagueRoles.some((role) => {
        const authorization = leagueRoles[role].authorize({ season: [action] });

        return authorization.success;
    });
}
