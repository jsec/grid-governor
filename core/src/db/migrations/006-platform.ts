import type { Kysely } from 'kysely';

import { sql } from 'kysely';

export async function down(db: Kysely<unknown>): Promise<void> {
    await db.schema.dropTable('audit_entry').execute();
    await db.schema.dropTable('notification').execute();
}

export async function up(db: Kysely<unknown>): Promise<void> {
    await db.schema
        .createTable('notification')
        .addColumn('notification_id', 'bigint', column =>
            column.generatedAlwaysAsIdentity().primaryKey(),
        )
        .addColumn('recipient_user_id', 'text', column => column.notNull())
        .addColumn('type_code', 'text', column => column.notNull())
        .addColumn('target_type', 'text', column => column.notNull())
        .addColumn('target_id', 'bigint', column => column.notNull())
        .addColumn('created_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addColumn('read_at', 'timestamptz')
        .addCheckConstraint('notification_type_code_check', sql`
          type_code in (
            'incident.needs_ruling',
            'incident.response_due',
            'ruling.published',
            'ruling.amended',
            'appeal.filed',
            'appeal.decided',
            'result.change_pending',
            'entry.approved'
          )
        `)
        .addForeignKeyConstraint(
            'notification_recipient_user_id_fkey',
            ['recipient_user_id'],
            'user',
            ['id'],
            constraint => constraint.onDelete('cascade'),
        )
        .execute();

    await db.schema
        .createTable('audit_entry')
        .addColumn('audit_entry_id', 'bigint', column =>
            column.generatedAlwaysAsIdentity().primaryKey(),
        )
        .addColumn('occurred_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addColumn('actor_user_id', 'text', column => column.notNull())
        .addColumn('actor_role', 'text', column => column.notNull())
        .addColumn('action', 'text', column => column.notNull())
        .addColumn('target_type', 'text', column => column.notNull())
        .addColumn('target_id', 'bigint', column => column.notNull())
        .addColumn('organization_id', 'text')
        .addColumn('league_id', 'bigint')
        .addColumn('changes', 'jsonb', column =>
            column.notNull().defaultTo(sql`'[]'::jsonb`),
        )
        .addCheckConstraint('audit_entry_changes_check', sql`jsonb_typeof(changes) = 'array'`)
        .addCheckConstraint(
            'audit_entry_league_scope_names_org',
            sql`league_id is null or organization_id is not null`,
        )
        .addForeignKeyConstraint(
            'audit_entry_actor_user_id_fkey',
            ['actor_user_id'],
            'user',
            ['id'],
            constraint => constraint.onDelete('restrict'),
        )
        .addForeignKeyConstraint(
            'audit_entry_league_id_organization_id_fkey',
            ['league_id', 'organization_id'],
            'league',
            ['league_id', 'organization_id'],
        )
        .addForeignKeyConstraint(
            'audit_entry_organization_id_fkey',
            ['organization_id'],
            'organization',
            ['id'],
            constraint => constraint.onDelete('restrict'),
        )
        .execute();

    await db.schema.createIndex('notification_recipient_user_id_idx')
        .on('notification')
        .column('recipient_user_id')
        .where(sql.ref('read_at'), 'is', null)
        .execute();

    await db.schema.createIndex('audit_entry_actor_user_id_occurred_at_idx')
        .on('audit_entry')
        .columns(['actor_user_id', 'occurred_at desc'])
        .execute();

    await db.schema.createIndex('audit_entry_league_id_occurred_at_idx')
        .on('audit_entry')
        .columns(['league_id', 'occurred_at desc'])
        .execute();

    await db.schema.createIndex('audit_entry_occurred_at_idx')
        .on('audit_entry')
        .column('occurred_at desc')
        .execute();
}
