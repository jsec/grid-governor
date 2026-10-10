import type { DB } from '@grid-governor/core/db/types';
import type { Kysely } from 'kysely';

import { roles } from '@grid-governor/core/access';
import { HTTPException } from 'hono/http-exception';

type Permissions = Parameters<typeof roles.member.authorize>[0];

export const requireMember = async (db: Kysely<DB>, userId: string, organizationId: string) => {
    const member = await db
        .selectFrom('member')
        .select('role')
        .$narrowType<{ role: keyof typeof roles }>()
        .where('organizationId', '=', organizationId)
        .where('userId', '=', userId)
        .executeTakeFirst();

    if (!member) {
        throw new HTTPException(404);
    }

    return member.role;
};

export const requirePermission = async (
    db: Kysely<DB>,
    userId: string,
    organizationId: string,
    permissions: Permissions,
) => {
    const role = await requireMember(db, userId, organizationId);

    const { success: isAuthorized } = roles[role].authorize(permissions);

    if (!isAuthorized) {
        throw new HTTPException(403);
    }

    return role;
};
