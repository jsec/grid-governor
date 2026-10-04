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
        .addCheckConstraint('season_drop_worst_check', sql`drop_worst >= 0`)
        .addCheckConstraint('season_expiry_rounds_check', sql`expiry_rounds > 0`)
        .addCheckConstraint('season_fastest_lap_bonus_check', sql`fastest_lap_bonus >= 0`)
        .addCheckConstraint('season_grid_limit_check', sql`grid_limit > 0`)
        .addCheckConstraint('season_points_scheme_check', sql`cardinality(points_scheme) > 0`)
        .addCheckConstraint('season_points_scheme_non_negative', sql`0 <= all (points_scheme)`)
        .addCheckConstraint('season_pole_bonus_check', sql`pole_bonus >= 0`)
        .addCheckConstraint(
            'season_registration_mode_check',
            sql`registration_mode in ('open', 'approval', 'invite')`,
        )
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
        .addCheckConstraint('round_ordinal_check', sql`ordinal >= 1`)
        .addCheckConstraint(
            'round_official_needs_lock',
            sql`official_at is null or grid_locked_at is not null`,
        )
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
        .addCheckConstraint('entry_car_number_check', sql`car_number between 0 and 999`)
        .addCheckConstraint(
            'entry_status_check',
            sql`status in ('pending', 'confirmed', 'declined', 'withdrawn')`,
        )
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
                sql`
                  case when best_lap is not null then 'set'
                                      when quali_laps > 0 then 'no_time'
                                      else 'no_show' end
                `,
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
        .addCheckConstraint('result_finish_position_check', sql`finish_position >= 1`)
        .addCheckConstraint(
            'result_finish_status_check',
            sql`finish_status in ('classified', 'dnf', 'dsq', 'dns')`,
        )
        .addCheckConstraint('result_grid_position_check', sql`grid_position >= 1`)
        .addCheckConstraint(
            'result_grid_source_check',
            sql`grid_source in ('qualified', 'pit_lane', 'back_of_grid', 'manual')`,
        )
        .addCheckConstraint('result_source_check', sql`source in ('import', 'manual')`)
        .addCheckConstraint(
            'result_best_lap_pair',
            sql`(best_lap is null) = (best_lap_set_at is null)`,
        )
        .addCheckConstraint(
            'result_classified_has_position',
            sql`(finish_status = 'classified') = (finish_position is not null)`,
        )
        .addCheckConstraint(
            'result_classified_has_time',
            sql`(finish_status = 'classified') = (race_time is not null)`,
        )
        .addCheckConstraint('result_edited_pair', sql`(edited_by is null) = (edited_at is null)`)
        .addCheckConstraint(
            'result_pit_lane_holds_no_slot',
            sql`grid_source is null or (grid_position is null) = (grid_source = 'pit_lane')`,
        )
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
    await sql`
      create index result_season_id_entry_id_total_points_idx
      on result (season_id, entry_id) include (total_points)
    `.execute(db);
}
