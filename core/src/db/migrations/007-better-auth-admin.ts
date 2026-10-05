import type { Kysely } from 'kysely';

export async function down(db: Kysely<unknown>): Promise<void> {
    await db.schema
        .alterTable('session')
        .dropColumn('impersonated_by')
        .execute();

    await db.schema
        .alterTable('user')
        .dropColumn('ban_expires')
        .dropColumn('ban_reason')
        .dropColumn('banned')
        .dropColumn('role')
        .execute();
}

export async function up(db: Kysely<unknown>): Promise<void> {
    await db.schema
        .alterTable('user')
        .addColumn('role', 'text')
        .addColumn('banned', 'boolean', column => column.notNull().defaultTo(false))
        .addColumn('ban_reason', 'text')
        .addColumn('ban_expires', 'timestamptz')
        .execute();

    await db.schema
        .alterTable('session')
        .addColumn('impersonated_by', 'text')
        .execute();
}
