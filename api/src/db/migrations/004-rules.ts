import type { Kysely } from 'kysely';

import { sql } from 'kysely';

export async function down(db: Kysely<unknown>): Promise<void> {
    await db.schema.dropTable('penalty_default').execute();
    await db.schema.dropTable('penalty').execute();
    await db.schema.dropTable('offense').execute();
}

export async function up(db: Kysely<unknown>): Promise<void> {
    await db.schema
        .createTable('offense')
        .addColumn('offense_id', 'bigint', column =>
            column.generatedAlwaysAsIdentity().primaryKey(),
        )
        .addColumn('code', 'text', column => column.notNull().unique())
        .addColumn('offense_group', 'text', column => column.notNull())
        .addColumn('name', 'text', column => column.notNull())
        .addColumn('description', 'text', column => column.notNull())
        .addColumn('display_order', 'integer', column => column.notNull())
        .addColumn('retired_at', 'timestamptz')
        .addColumn('created_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .execute();

    await db.schema
        .createTable('penalty')
        .addColumn('penalty_id', 'bigint', column =>
            column.generatedAlwaysAsIdentity().primaryKey(),
        )
        .addColumn('code', 'text', column => column.notNull().unique())
        .addColumn('label', 'text', column => column.notNull())
        .addColumn('severity_rank', 'integer', column => column.notNull())
        .addColumn('retired_at', 'timestamptz')
        .execute();

    await db.schema
        .createTable('penalty_default')
        .addColumn('penalty_default_id', 'bigint', column =>
            column.generatedAlwaysAsIdentity().primaryKey(),
        )
        .addColumn('organization_id', 'bigint', column => column.notNull())
        .addColumn('league_id', 'bigint')
        .addColumn('offense_id', 'bigint', column => column.notNull())
        .addColumn('penalty_id', 'bigint', column => column.notNull())
        .addColumn('default_points', 'integer', column =>
            column.notNull().defaultTo(0),
        )
        .addColumn('default_time_seconds', 'integer', column =>
            column.notNull().defaultTo(0),
        )
        .addColumn('default_ban_rounds', 'integer', column =>
            column.notNull().defaultTo(0),
        )
        .addColumn('default_voids_result', 'boolean', column =>
            column.notNull().defaultTo(false),
        )
        .addColumn('created_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addForeignKeyConstraint(
            'penalty_default_league_id_organization_id_fkey',
            ['league_id', 'organization_id'],
            'league',
            ['league_id', 'organization_id'],
        )
        .addForeignKeyConstraint(
            'penalty_default_offense_id_fkey',
            ['offense_id'],
            'offense',
            ['offense_id'],
        )
        .addForeignKeyConstraint(
            'penalty_default_organization_id_fkey',
            ['organization_id'],
            'organization',
            ['organization_id'],
        )
        .addForeignKeyConstraint(
            'penalty_default_penalty_id_fkey',
            ['penalty_id'],
            'penalty',
            ['penalty_id'],
        )
        .execute();

    await db.schema
        .createIndex('penalty_default_offense_id_idx')
        .on('penalty_default')
        .column('offense_id')
        .execute();
    await db.schema
        .createIndex('penalty_default_organization_id_league_id_offense_id_idx')
        .on('penalty_default')
        .unique()
        .columns(['organization_id', 'league_id', 'offense_id'])
        .nullsNotDistinct()
        .execute();
    await db.schema
        .createIndex('penalty_default_penalty_id_idx')
        .on('penalty_default')
        .column('penalty_id')
        .execute();
}
