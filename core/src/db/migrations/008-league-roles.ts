import { type Kysely, sql } from 'kysely';

export async function down(db: Kysely<unknown>) {
    await db.schema
        .alterTable('league_membership')
        .dropConstraint('league_membership_role_check')
        .execute();
}

export async function up(db: Kysely<unknown>) {
    await db.schema
        .alterTable('league_membership')
        .addCheckConstraint(
            'league_membership_role_check',
            sql`role in ('manager', 'steward', 'appeals')`,
        )
        .execute();
}
