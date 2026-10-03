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
        .addColumn('createdAt', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addColumn('archived_at', 'timestamptz')
        .execute();

    await db.schema
        .createTable('member')
        .addColumn('id', 'text', column => column.primaryKey())
        .addColumn('organizationId', 'text', column =>
            column.notNull().references('organization.id')
                .onDelete('cascade'),
        )
        .addColumn('userId', 'text', column =>
            column.notNull().references('user.id')
                .onDelete('cascade'),
        )
        .addColumn('role', 'text', column => column.notNull())
        .addColumn('createdAt', 'timestamptz', column => column.notNull())
        .execute();

    await db.schema
        .createTable('invitation')
        .addColumn('id', 'text', column => column.primaryKey())
        .addColumn('organizationId', 'text', column =>
            column.notNull().references('organization.id')
                .onDelete('cascade'),
        )
        .addColumn('email', 'text', column => column.notNull())
        .addColumn('role', 'text')
        .addColumn('status', 'text', column => column.notNull())
        .addColumn('expiresAt', 'timestamptz', column => column.notNull())
        .addColumn('inviterId', 'text', column =>
            column.notNull().references('user.id')
                .onDelete('cascade'),
        )
        .addColumn('createdAt', 'timestamptz', column =>
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
        .createIndex('organization_name_idx')
        .on('organization')
        .using('gin')
        .column(sql`name gin_trgm_ops`)
        .execute();
    await db.schema
        .createIndex('member_organizationId_idx')
        .on('member')
        .column('organizationId')
        .execute();
    await db.schema
        .createIndex('member_userId_idx')
        .on('member')
        .column('userId')
        .execute();
    await db.schema
        .createIndex('invitation_organizationId_idx')
        .on('invitation')
        .column('organizationId')
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
        .nullsNotDistinct()
        .where(sql.ref('revoked_at'), 'is', null)
        .execute();
}
