import { type Kysely, sql } from 'kysely';

export async function down(db: Kysely<unknown>) {
    await db.schema
        .alterTable('entry')
        .dropConstraint('entry_driver_id_platform_fkey')
        .execute();

    await db.schema
        .alterTable('entry')
        .dropConstraint('entry_season_id_platform_fkey')
        .execute();

    await db.schema
        .alterTable('entry')
        .dropColumn('platform')
        .execute();

    await db.schema
        .alterTable('entry')
        .addForeignKeyConstraint('entry_driver_id_fkey', ['driver_id'], 'driver', ['driver_id'])
        .execute();

    await db.schema
        .alterTable('entry')
        .addForeignKeyConstraint('entry_season_id_fkey', ['season_id'], 'season', ['season_id'])
        .execute();

    await db.schema
        .alterTable('season')
        .dropColumn('platform')
        .execute();

    await db.schema
        .alterTable('driver')
        .dropColumn('platform')
        .execute();

    await db.schema
        .alterTable('driver')
        .addUniqueConstraint('driver_sim_id_key', ['sim_id'])
        .execute();
}

export async function up(db: Kysely<unknown>) {
    await db.schema
        .alterTable('driver')
        .addColumn('platform', 'text', column => column
            .notNull()
            .defaultTo('iracing')
            .check(sql`platform in ('acc', 'iracing', 'lmu')`))
        .execute();

    await db.schema
        .alterTable('driver')
        .alterColumn('platform', column => column.dropDefault())
        .execute();

    await db.schema
        .alterTable('driver')
        .dropConstraint('driver_sim_id_key')
        .execute();

    await db.schema
        .alterTable('driver')
        .addUniqueConstraint('driver_platform_sim_id_key', ['platform', 'sim_id'])
        .execute();

    await db.schema
        .alterTable('driver')
        .addUniqueConstraint('driver_driver_id_platform_key', ['driver_id', 'platform'])
        .execute();

    await db.schema
        .alterTable('season')
        .addColumn('platform', 'text', column => column
            .notNull()
            .defaultTo('iracing')
            .check(sql`platform in ('acc', 'iracing', 'lmu')`))
        .execute();

    await db.schema
        .alterTable('season')
        .alterColumn('platform', column => column.dropDefault())
        .execute();

    await db.schema
        .alterTable('season')
        .addUniqueConstraint('season_season_id_platform_key', ['season_id', 'platform'])
        .execute();

    await db.schema
        .alterTable('entry')
        .addColumn('platform', 'text', column => column.notNull().defaultTo('iracing'))
        .execute();

    await db.schema
        .alterTable('entry')
        .alterColumn('platform', column => column.dropDefault())
        .execute();

    await db.schema
        .alterTable('entry')
        .dropConstraint('entry_driver_id_fkey')
        .execute();

    await db.schema
        .alterTable('entry')
        .dropConstraint('entry_season_id_fkey')
        .execute();

    await db.schema
        .alterTable('entry')
        .addForeignKeyConstraint(
            'entry_driver_id_platform_fkey',
            ['driver_id', 'platform'],
            'driver',
            ['driver_id', 'platform'],
        )
        .execute();

    await db.schema
        .alterTable('entry')
        .addForeignKeyConstraint(
            'entry_season_id_platform_fkey',
            ['season_id', 'platform'],
            'season',
            ['season_id', 'platform'],
        )
        .execute();
}
