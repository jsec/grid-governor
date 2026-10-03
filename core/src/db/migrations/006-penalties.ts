import type { Kysely } from 'kysely';

import { sql } from 'kysely';

export async function down(db: Kysely<unknown>): Promise<void> {
    await db.schema.dropTable('attachment').execute();
    await db.schema.dropTable('race_ban').execute();
    await db.schema.dropTable('appeal').execute();
    await db.schema.dropTable('ruling').execute();
    await db.schema.dropTable('incident').execute();
}

export async function up(db: Kysely<unknown>): Promise<void> {
    await db.schema
        .createTable('incident')
        .addColumn('incident_id', 'bigint', column =>
            column.generatedAlwaysAsIdentity().primaryKey(),
        )
        .addColumn('round_id', 'bigint', column => column.notNull())
        .addColumn('season_id', 'bigint', column => column.notNull())
        .addColumn('reported_by_entry_id', 'bigint')
        .addColumn('accused_entry_id', 'bigint', column => column.notNull())
        .addColumn('offense_id', 'bigint', column => column.notNull())
        .addColumn('lap', 'integer')
        .addColumn('reporter_statement', 'text')
        .addColumn('accused_statement', 'text')
        .addColumn('accused_responded_at', 'timestamptz')
        .addColumn('filed_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addColumn('ruled_at', 'timestamptz')
        .addColumn('appeal_closes_at', 'timestamptz')
        .addForeignKeyConstraint(
            'incident_accused_entry_id_season_id_fkey',
            ['accused_entry_id', 'season_id'],
            'entry',
            ['entry_id', 'season_id'],
        )
        .addForeignKeyConstraint(
            'incident_offense_id_fkey',
            ['offense_id'],
            'offense',
            ['offense_id'],
        )
        .addForeignKeyConstraint(
            'incident_reported_by_entry_id_season_id_fkey',
            ['reported_by_entry_id', 'season_id'],
            'entry',
            ['entry_id', 'season_id'],
        )
        .addForeignKeyConstraint(
            'incident_round_id_season_id_fkey',
            ['round_id', 'season_id'],
            'round',
            ['round_id', 'season_id'],
        )
        .execute();

    await db.schema
        .createTable('ruling')
        .addColumn('incident_id', 'bigint', column => column.notNull())
        .addColumn('revision', 'integer', column => column.notNull())
        .addColumn('origin', 'text', column => column.notNull())
        .addColumn('fault', 'text', column => column.notNull())
        .addColumn('penalty_id', 'bigint', column => column.notNull())
        .addColumn('penalty_points', 'integer', column =>
            column.notNull().defaultTo(0),
        )
        .addColumn('time_penalty_seconds', 'integer', column =>
            column.notNull().defaultTo(0),
        )
        .addColumn('ban_rounds', 'integer', column => column.notNull().defaultTo(0))
        .addColumn('voids_result', 'boolean', column =>
            column.notNull().defaultTo(false),
        )
        .addColumn('reasoning', 'text', column => column.notNull())
        .addColumn('author_user_id', 'text', column => column.notNull())
        .addColumn('created_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addColumn('results_applied_at', 'timestamptz')
        .addColumn('results_rejected_at', 'timestamptz')
        .addPrimaryKeyConstraint('ruling_pkey', ['incident_id', 'revision'])
        .addForeignKeyConstraint(
            'ruling_author_user_id_fkey',
            ['author_user_id'],
            'user',
            ['id'],
            constraint => constraint.onDelete('restrict'),
        )
        .addForeignKeyConstraint(
            'ruling_incident_id_fkey',
            ['incident_id'],
            'incident',
            ['incident_id'],
            constraint => constraint.onDelete('restrict'),
        )
        .addForeignKeyConstraint(
            'ruling_penalty_id_fkey',
            ['penalty_id'],
            'penalty',
            ['penalty_id'],
        )
        .execute();

    await db.schema
        .createTable('appeal')
        .addColumn('appeal_id', 'bigint', column =>
            column.generatedAlwaysAsIdentity().primaryKey(),
        )
        .addColumn('incident_id', 'bigint', column => column.notNull())
        .addColumn('season_id', 'bigint', column => column.notNull())
        .addColumn('filed_by_entry_id', 'bigint', column => column.notNull())
        .addColumn('grounds', 'text', column => column.notNull())
        .addColumn('statement', 'text', column => column.notNull())
        .addColumn('acknowledged_at', 'timestamptz', column => column.notNull())
        .addColumn('filed_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addColumn('decision_due_at', 'timestamptz', column => column.notNull())
        .addColumn('assigned_to', 'text')
        .addColumn('outcome', 'text')
        .addColumn('decision_revision', 'integer')
        .addColumn('decision_reasoning', 'text')
        .addColumn('decided_by', 'text')
        .addColumn('decided_at', 'timestamptz')
        .addUniqueConstraint('appeal_appeal_id_incident_id_key', [
            'appeal_id',
            'incident_id',
        ])
        .addUniqueConstraint('appeal_incident_id_key', ['incident_id'])
        .addForeignKeyConstraint(
            'appeal_assigned_to_fkey',
            ['assigned_to'],
            'user',
            ['id'],
            constraint => constraint.onDelete('set null'),
        )
        .addForeignKeyConstraint(
            'appeal_decided_by_fkey',
            ['decided_by'],
            'user',
            ['id'],
            constraint => constraint.onDelete('restrict'),
        )
        .addForeignKeyConstraint(
            'appeal_filed_by_entry_id_season_id_fkey',
            ['filed_by_entry_id', 'season_id'],
            'entry',
            ['entry_id', 'season_id'],
        )
        .addForeignKeyConstraint(
            'appeal_incident_id_decision_revision_fkey',
            ['incident_id', 'decision_revision'],
            'ruling',
            ['incident_id', 'revision'],
        )
        .addForeignKeyConstraint(
            'appeal_incident_id_fkey',
            ['incident_id'],
            'incident',
            ['incident_id'],
            constraint => constraint.onDelete('restrict'),
        )
        .execute();

    await db.schema
        .createTable('race_ban')
        .addColumn('round_id', 'bigint', column => column.notNull())
        .addColumn('entry_id', 'bigint', column => column.notNull())
        .addColumn('season_id', 'bigint', column => column.notNull())
        .addColumn('incident_id', 'bigint', column => column.notNull())
        .addColumn('source_revision', 'integer', column => column.notNull())
        .addColumn('created_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addPrimaryKeyConstraint('race_ban_pkey', ['round_id', 'entry_id'])
        .addForeignKeyConstraint(
            'race_ban_entry_id_season_id_fkey',
            ['entry_id', 'season_id'],
            'entry',
            ['entry_id', 'season_id'],
        )
        .addForeignKeyConstraint(
            'race_ban_incident_id_source_revision_fkey',
            ['incident_id', 'source_revision'],
            'ruling',
            ['incident_id', 'revision'],
        )
        .addForeignKeyConstraint(
            'race_ban_round_id_season_id_fkey',
            ['round_id', 'season_id'],
            'round',
            ['round_id', 'season_id'],
        )
        .execute();

    await db.schema
        .createTable('attachment')
        .addColumn('attachment_id', 'bigint', column =>
            column.generatedAlwaysAsIdentity().primaryKey(),
        )
        .addColumn('incident_id', 'bigint', column => column.notNull())
        .addColumn('appeal_id', 'bigint')
        .addColumn('kind', 'text', column => column.notNull())
        .addColumn('url', 'text')
        .addColumn('storage_key', 'text')
        .addColumn('original_name', 'text')
        .addColumn('byte_size', 'bigint')
        .addColumn('submitted_by', 'text', column => column.notNull())
        .addColumn('submitted_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addForeignKeyConstraint(
            'attachment_appeal_id_fkey',
            ['appeal_id'],
            'appeal',
            ['appeal_id'],
            constraint => constraint.onDelete('cascade'),
        )
        .addForeignKeyConstraint(
            'attachment_appeal_id_incident_id_fkey',
            ['appeal_id', 'incident_id'],
            'appeal',
            ['appeal_id', 'incident_id'],
        )
        .addForeignKeyConstraint(
            'attachment_incident_id_fkey',
            ['incident_id'],
            'incident',
            ['incident_id'],
            constraint => constraint.onDelete('cascade'),
        )
        .addForeignKeyConstraint(
            'attachment_submitted_by_fkey',
            ['submitted_by'],
            'user',
            ['id'],
            constraint => constraint.onDelete('restrict'),
        )
        .execute();

    await db.schema
        .createIndex('incident_accused_entry_id_idx')
        .on('incident')
        .column('accused_entry_id')
        .execute();
    await db.schema
        .createIndex('incident_offense_id_idx')
        .on('incident')
        .column('offense_id')
        .execute();
    await db.schema
        .createIndex('incident_reported_by_entry_id_idx')
        .on('incident')
        .column('reported_by_entry_id')
        .execute();
    await db.schema
        .createIndex('incident_round_id_idx')
        .on('incident')
        .column('round_id')
        .execute();
    await db.schema
        .createIndex('incident_season_id_idx')
        .on('incident')
        .column('season_id')
        .where(sql.ref('ruled_at'), 'is', null)
        .execute();
    await db.schema
        .createIndex('ruling_author_user_id_idx')
        .on('ruling')
        .column('author_user_id')
        .execute();
    await db.schema
        .createIndex('ruling_incident_id_idx')
        .on('ruling')
        .unique()
        .column('incident_id')
        .where(sql.ref('origin'), '=', 'amendment')
        .execute();
    await db.schema
        .createIndex('ruling_incident_id_idx1')
        .on('ruling')
        .unique()
        .column('incident_id')
        .where(sql.ref('origin'), '=', 'appeal')
        .execute();
    await db.schema
        .createIndex('ruling_penalty_id_idx')
        .on('ruling')
        .column('penalty_id')
        .execute();
    await db.schema
        .createIndex('appeal_filed_by_entry_id_idx')
        .on('appeal')
        .column('filed_by_entry_id')
        .execute();
    await db.schema
        .createIndex('appeal_incident_id_idx')
        .on('appeal')
        .column('incident_id')
        .where(sql.ref('decided_at'), 'is', null)
        .execute();
    await db.schema
        .createIndex('race_ban_entry_id_idx')
        .on('race_ban')
        .column('entry_id')
        .execute();
    await db.schema
        .createIndex('race_ban_incident_id_source_revision_idx')
        .on('race_ban')
        .columns(['incident_id', 'source_revision'])
        .execute();
    await db.schema
        .createIndex('attachment_appeal_id_idx')
        .on('attachment')
        .column('appeal_id')
        .execute();
    await db.schema
        .createIndex('attachment_incident_id_idx')
        .on('attachment')
        .column('incident_id')
        .execute();
}
