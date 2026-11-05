import type { DB } from '@grid-governor/core/db/types';
import type { Kysely } from 'kysely';

import { isDeepStrictEqual } from 'node:util';

export type Actor = {
    leagueId: string;
    organizationId: string;
    role: string;
    userId: string;
};

type AuditRecord = {
    action: string;
    actor: Actor;
    changes?: object[];
    targetId: string;
    targetType: string;
};

export const recordAudit = async (db: Kysely<DB>, record: AuditRecord) => {
    await db
        .insertInto('auditEntry')
        .values({
            action: record.action,
            actorRole: record.actor.role,
            actorUserId: record.actor.userId,
            changes: JSON.stringify(record.changes ?? []),
            leagueId: record.actor.leagueId,
            organizationId: record.actor.organizationId,
            targetId: record.targetId,
            targetType: record.targetType,
        })
        .execute();
};

export const listChanges = <Values extends object>(
    fields: readonly (keyof Values)[],
    before: Values,
    after: Values,
) => {
    const changes = [];

    for (const field of fields) {
        if (!isDeepStrictEqual(before[field], after[field])) {
            changes.push({
                field,
                from: before[field],
                to: after[field],
            });
        }
    }

    return changes;
};
