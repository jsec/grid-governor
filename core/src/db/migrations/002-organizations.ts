import type { Kysely } from 'kysely';

import { sql } from 'kysely';

export async function down(db: Kysely<unknown>): Promise<void> {
    await db.schema.dropTable('invitation').execute();
    await db.schema.dropTable('member').execute();
    await db.schema.dropTable('league_membership').execute();
    await db.schema.dropTable('league').execute();
    await db.schema.dropTable('organization').execute();
}

export async function up(db: Kysely<unknown>): Promise<void> {
    await db.schema
        .createTable('organization')
        .addColumn('id', 'text', column => column.primaryKey())
        .addColumn('name', 'text', column => column.notNull())
        .addColumn('slug', 'text', column => column.notNull().unique())
        .addColumn('logo', 'text')
        .addColumn('metadata', 'text')
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
        .addCheckConstraint(
            'organization_appeal_decision_sla_hours_check',
            sql`appeal_decision_sla_hours > 0`,
        )
        .addCheckConstraint(
            'organization_appeal_quota_per_season_check',
            sql`appeal_quota_per_season >= 0`,
        )
        .addCheckConstraint('organization_appeal_window_hours_check', sql`appeal_window_hours > 0`)
        .addCheckConstraint('organization_ban_length_rounds_check', sql`ban_length_rounds > 0`)
        .addCheckConstraint(
            'organization_suspension_threshold_points_check',
            sql`suspension_threshold_points > 0`,
        )
        .execute();

    await db.schema
        .createTable('member')
        .addColumn('id', 'text', column => column.primaryKey())
        .addColumn('organization_id', 'text', column =>
            column.notNull().references('organization.id')
                .onDelete('cascade'),
        )
        .addColumn('user_id', 'text', column =>
            column.notNull().references('user.id')
                .onDelete('cascade'),
        )
        .addColumn('role', 'text', column => column.notNull())
        .addColumn('created_at', 'timestamptz', column => column.notNull())
        .addUniqueConstraint('member_organization_id_user_id_key', ['organization_id', 'user_id'])
        .execute();

    await db.schema
        .createTable('invitation')
        .addColumn('id', 'text', column => column.primaryKey())
        .addColumn('organization_id', 'text', column =>
            column.notNull().references('organization.id')
                .onDelete('cascade'),
        )
        .addColumn('email', 'text', column => column.notNull())
        .addColumn('role', 'text')
        .addColumn('status', 'text', column => column.notNull())
        .addColumn('expires_at', 'timestamptz', column => column.notNull())
        .addColumn('inviter_id', 'text', column =>
            column.notNull().references('user.id')
                .onDelete('cascade'),
        )
        .addColumn('created_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .execute();

    await db.schema
        .createTable('league')
        .addColumn('league_id', 'bigint', column =>
            column.generatedAlwaysAsIdentity().primaryKey(),
        )
        .addColumn('organization_id', 'text', column => column.notNull())
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
        .addCheckConstraint('league_ban_length_rounds_check', sql`ban_length_rounds > 0`)
        .addCheckConstraint('league_ruling_sla_hours_check', sql`ruling_sla_hours > 0`)
        .addCheckConstraint(
            'league_suspension_threshold_points_check',
            sql`suspension_threshold_points > 0`,
        )
        .addForeignKeyConstraint(
            'league_organization_id_fkey',
            ['organization_id'],
            'organization',
            ['id'],
        )
        .execute();

    await db.schema
        .createTable('league_membership')
        .addColumn('membership_id', 'bigint', column =>
            column.generatedAlwaysAsIdentity().primaryKey(),
        )
        .addColumn('user_id', 'text', column => column.notNull())
        .addColumn('role', 'text', column => column.notNull())
        .addColumn('league_id', 'bigint', column => column.notNull())
        .addColumn('granted_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addColumn('granted_by', 'text')
        .addColumn('revoked_at', 'timestamptz')
        .addForeignKeyConstraint(
            'league_membership_granted_by_fkey',
            ['granted_by'],
            'user',
            ['id'],
            constraint => constraint.onDelete('set null'),
        )
        .addForeignKeyConstraint(
            'league_membership_league_id_fkey',
            ['league_id'],
            'league',
            ['league_id'],
            constraint => constraint.onDelete('cascade'),
        )
        .addForeignKeyConstraint(
            'league_membership_user_id_fkey',
            ['user_id'],
            'user',
            ['id'],
            constraint => constraint.onDelete('cascade'),
        )
        .execute();

    await db.schema
        .createIndex('member_user_id_idx')
        .on('member')
        .column('user_id')
        .execute();
    await db.schema
        .createIndex('invitation_organization_id_idx')
        .on('invitation')
        .column('organization_id')
        .execute();
    await db.schema
        .createIndex('invitation_email_idx')
        .on('invitation')
        .column('email')
        .execute();
    await db.schema
        .createIndex('league_organization_id_idx')
        .on('league')
        .column('organization_id')
        .where(sql.ref('archived_at'), 'is', null)
        .execute();
    await db.schema
        .createIndex('league_membership_user_id_role_league_id_idx')
        .on('league_membership')
        .unique()
        .columns(['user_id', 'role', 'league_id'])
        .where(sql.ref('revoked_at'), 'is', null)
        .execute();
}
