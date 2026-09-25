import type { Kysely } from 'kysely';

import { sql } from 'kysely';

export async function down(db: Kysely<unknown>): Promise<void> {
    await db.schema.dropTable('membership').execute();
    await db.schema.dropTable('league').execute();
    await db.schema.dropTable('organization').execute();
}

export async function up(db: Kysely<unknown>): Promise<void> {
    await db.schema
        .createTable('organization')
        .addColumn('organization_id', 'bigint', column =>
            column.generatedAlwaysAsIdentity().primaryKey(),
        )
        .addColumn('name', 'text', column => column.notNull().unique())
        .addColumn('appeal_window_hours', 'integer', column =>
            column.notNull().defaultTo(48),
        )
        .addColumn('appeal_quota_per_season', 'integer', column =>
            column.notNull().defaultTo(3),
        )
        .addColumn('appeal_decision_sla_hours', 'integer', column =>
            column.notNull().defaultTo(72),
        )
        .addColumn('suspension_threshold_points', 'integer', column =>
            column.notNull(),
        )
        .addColumn('ban_length_rounds', 'integer', column => column.notNull())
        .addColumn('created_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addColumn('archived_at', 'timestamptz')
        .execute();

    await db.schema
        .createTable('league')
        .addColumn('league_id', 'bigint', column =>
            column.generatedAlwaysAsIdentity().primaryKey(),
        )
        .addColumn('organization_id', 'bigint', column => column.notNull())
        .addColumn('name', 'text', column => column.notNull())
        .addColumn('ruling_sla_hours', 'integer', column =>
            column.notNull().defaultTo(24),
        )
        .addColumn('suspension_threshold_points', 'integer')
        .addColumn('ban_length_rounds', 'integer')
        .addColumn('created_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addColumn('archived_at', 'timestamptz')
        .addUniqueConstraint('league_league_id_organization_id_key', [
            'league_id',
            'organization_id',
        ])
        .addUniqueConstraint('league_organization_id_name_key', [
            'organization_id',
            'name',
        ])
        .addForeignKeyConstraint(
            'league_organization_id_fkey',
            ['organization_id'],
            'organization',
            ['organization_id'],
        )
        .execute();

    await db.schema
        .createTable('membership')
        .addColumn('membership_id', 'bigint', column =>
            column.generatedAlwaysAsIdentity().primaryKey(),
        )
        .addColumn('user_id', 'text', column => column.notNull())
        .addColumn('role', 'text', column => column.notNull())
        .addColumn('organization_id', 'bigint')
        .addColumn('league_id', 'bigint')
        .addColumn('granted_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addColumn('granted_by', 'text')
        .addColumn('revoked_at', 'timestamptz')
        .addForeignKeyConstraint(
            'membership_granted_by_fkey',
            ['granted_by'],
            'user',
            ['id'],
            constraint => constraint.onDelete('set null'),
        )
        .addForeignKeyConstraint(
            'membership_league_id_fkey',
            ['league_id'],
            'league',
            ['league_id'],
            constraint => constraint.onDelete('cascade'),
        )
        .addForeignKeyConstraint(
            'membership_organization_id_fkey',
            ['organization_id'],
            'organization',
            ['organization_id'],
            constraint => constraint.onDelete('cascade'),
        )
        .addForeignKeyConstraint(
            'membership_user_id_fkey',
            ['user_id'],
            'user',
            ['id'],
            constraint => constraint.onDelete('cascade'),
        )
        .execute();

    await db.schema
        .createIndex('organization_name_idx')
        .on('organization')
        .using('gin')
        .column(sql`name gin_trgm_ops`)
        .execute();
    await db.schema
        .createIndex('league_organization_id_idx')
        .on('league')
        .column('organization_id')
        .where(sql.ref('archived_at'), 'is', null)
        .execute();
    await db.schema
        .createIndex('membership_user_id_role_organization_id_league_id_idx')
        .on('membership')
        .unique()
        .columns(['user_id', 'role', 'organization_id', 'league_id'])
        .nullsNotDistinct()
        .where(sql.ref('revoked_at'), 'is', null)
        .execute();
}
