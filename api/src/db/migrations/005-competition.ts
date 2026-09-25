import type { Kysely } from 'kysely';

import { sql } from 'kysely';

export async function down(db: Kysely<unknown>): Promise<void> {
    await db.schema.dropTable('result').execute();
    await db.schema.dropTable('entry').execute();
    await db.schema.dropTable('round').execute();
    await db.schema.dropTable('season').execute();
    await db.schema.dropTable('driver').execute();
}

export async function up(db: Kysely<unknown>): Promise<void> {
    await db.schema
        .createTable('driver')
        .addColumn('driver_id', 'bigint', column =>
            column.generatedAlwaysAsIdentity().primaryKey(),
        )
        .addColumn('user_id', 'text', column => column.unique())
        .addColumn('display_name', 'text', column => column.notNull())
        .addColumn('sim_id', 'text', column => column.notNull().unique())
        .addColumn('created_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addForeignKeyConstraint(
            'driver_user_id_fkey',
            ['user_id'],
            'user',
            ['id'],
            constraint => constraint.onDelete('set null'),
        )
        .execute();

    await db.schema
        .createTable('season')
        .addColumn('season_id', 'bigint', column =>
            column.generatedAlwaysAsIdentity().primaryKey(),
        )
        .addColumn('league_id', 'bigint', column => column.notNull())
        .addColumn('name', 'text', column => column.notNull())
        .addColumn('registration_mode', 'text', column =>
            column.notNull().defaultTo('approval'),
        )
        .addColumn('registration_closes_at', 'timestamptz')
        .addColumn('grid_limit', 'integer')
        .addColumn('points_scheme', sql`integer[]`, column => column.notNull())
        .addColumn('fastest_lap_bonus', 'integer', column =>
            column.notNull().defaultTo(0),
        )
        .addColumn('pole_bonus', 'integer', column => column.notNull().defaultTo(0))
        .addColumn('drop_worst', 'integer', column => column.notNull().defaultTo(0))
        .addColumn('expiry_rounds', 'integer')
        .addColumn('created_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addUniqueConstraint('season_league_id_name_key', ['league_id', 'name'])
        .addForeignKeyConstraint(
            'season_league_id_fkey',
            ['league_id'],
            'league',
            ['league_id'],
        )
        .execute();

    await db.schema
        .createTable('round')
        .addColumn('round_id', 'bigint', column =>
            column.generatedAlwaysAsIdentity().primaryKey(),
        )
        .addColumn('season_id', 'bigint', column => column.notNull())
        .addColumn('ordinal', 'integer', column => column.notNull())
        .addColumn('track', 'text', column => column.notNull())
        .addColumn('starts_at', 'timestamptz')
        .addColumn('grid_locked_at', 'timestamptz')
        .addColumn('official_at', 'timestamptz')
        .addColumn('created_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addUniqueConstraint('round_round_id_season_id_key', [
            'round_id',
            'season_id',
        ])
        .addUniqueConstraint('round_season_id_ordinal_key', ['season_id', 'ordinal'])
        .addForeignKeyConstraint(
            'round_season_id_fkey',
            ['season_id'],
            'season',
            ['season_id'],
        )
        .execute();

    await db.schema
        .createTable('entry')
        .addColumn('entry_id', 'bigint', column =>
            column.generatedAlwaysAsIdentity().primaryKey(),
        )
        .addColumn('season_id', 'bigint', column => column.notNull())
        .addColumn('driver_id', 'bigint', column => column.notNull())
        .addColumn('car_number', 'integer', column => column.notNull())
        .addColumn('status', 'text', column =>
            column.notNull().defaultTo('pending'),
        )
        .addColumn('created_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addUniqueConstraint('entry_entry_id_season_id_key', ['entry_id', 'season_id'])
        .addUniqueConstraint('entry_season_id_driver_id_key', ['season_id', 'driver_id'])
        .addForeignKeyConstraint(
            'entry_driver_id_fkey',
            ['driver_id'],
            'driver',
            ['driver_id'],
        )
        .addForeignKeyConstraint(
            'entry_season_id_fkey',
            ['season_id'],
            'season',
            ['season_id'],
        )
        .execute();

    await db.schema
        .createTable('result')
        .addColumn('round_id', 'bigint', column => column.notNull())
        .addColumn('entry_id', 'bigint', column => column.notNull())
        .addColumn('season_id', 'bigint', column => column.notNull())
        .addColumn('best_lap', sql`interval`)
        .addColumn('best_lap_set_at', 'timestamptz')
        .addColumn('quali_laps', 'integer', column => column.notNull().defaultTo(0))
        .addColumn('quali_status', 'text', column =>
            column.generatedAlwaysAs(
                sql`case when best_lap is not null then 'set' when quali_laps > 0 then 'no_time' else 'no_show' end`,
            ),
        )
        .addColumn('grid_position', 'integer')
        .addColumn('grid_source', 'text')
        .addColumn('finish_status', 'text')
        .addColumn('laps_completed', 'integer', column =>
            column.notNull().defaultTo(0),
        )
        .addColumn('race_time', sql`interval`)
        .addColumn('finish_position', 'integer')
        .addColumn('position_points', 'integer', column =>
            column.notNull().defaultTo(0),
        )
        .addColumn('fastest_lap_points', 'integer', column =>
            column.notNull().defaultTo(0),
        )
        .addColumn('pole_points', 'integer', column =>
            column.notNull().defaultTo(0),
        )
        .addColumn('total_points', 'integer', column =>
            column
                .generatedAlwaysAs(
                    sql`position_points + fastest_lap_points + pole_points`,
                )
                .stored(),
        )
        .addColumn('source', 'text', column => column.notNull().defaultTo('import'))
        .addColumn('edited_by', 'text')
        .addColumn('edited_at', 'timestamptz')
        .addColumn('created_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addPrimaryKeyConstraint('result_pkey', ['round_id', 'entry_id'])
        .addForeignKeyConstraint(
            'result_edited_by_fkey',
            ['edited_by'],
            'user',
            ['id'],
            constraint => constraint.onDelete('set null'),
        )
        .addForeignKeyConstraint(
            'result_entry_id_season_id_fkey',
            ['entry_id', 'season_id'],
            'entry',
            ['entry_id', 'season_id'],
        )
        .addForeignKeyConstraint(
            'result_round_id_season_id_fkey',
            ['round_id', 'season_id'],
            'round',
            ['round_id', 'season_id'],
        )
        .execute();

    await db.schema
        .createIndex('driver_display_name_idx')
        .on('driver')
        .using('gin')
        .column(sql`display_name gin_trgm_ops`)
        .execute();
    await db.schema
        .createIndex('entry_driver_id_idx')
        .on('entry')
        .column('driver_id')
        .execute();
    await db.schema
        .createIndex('entry_season_id_car_number_idx')
        .on('entry')
        .unique()
        .columns(['season_id', 'car_number'])
        .where(sql.ref('status'), 'in', ['pending', 'confirmed'])
        .execute();
    await db.schema
        .createIndex('result_entry_id_idx')
        .on('result')
        .column('entry_id')
        .execute();
    await sql`create index result_season_id_entry_id_total_points_idx on result (season_id, entry_id) include (total_points)`.execute(
        db,
    );
}
