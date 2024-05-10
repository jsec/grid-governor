/* eslint-disable unicorn/filename-case */
import { type Kysely } from 'kysely';

import { withTimestamps } from '../utils.js';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('platforms')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('name', 'varchar(255)', col => col.notNull())
    .$call(withTimestamps)
    .execute();

  await db.schema
    .createTable('leagues')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('name', 'varchar(50)', col => col.notNull())
    .addColumn('description', 'varchar(255)', col => col.notNull())
    .$call(withTimestamps)
    .execute();

  await db.schema
    .createTable('penalties')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('name', 'varchar(50)', col => col.notNull())
    .addColumn('description', 'varchar(255)', col => col.notNull())
    .$call(withTimestamps)
    .execute();

  await db.schema
    .createTable('drivers')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('first_name', 'varchar(50)', col => col.notNull())
    .addColumn('last_name', 'varchar(50)', col => col.notNull())
    .addColumn('steam_id', 'varchar(100)')
    .addColumn('discord_id', 'varchar(100)')
    .$call(withTimestamps)
    .execute();

  await db.schema
    .createTable('seasons')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('name', 'varchar(50)', col => col.notNull())
    .addColumn('description', 'varchar(255)', col => col.notNull())
    .addColumn('league_id', 'integer', col => col.notNull().references('leagues.id'))
    .addColumn('platform_id', 'integer', col => col.notNull().references('platforms.id'))
    .addColumn('start_date', 'date', col => col.notNull())
    .addColumn('end_date', 'date')
    .$call(withTimestamps)
    .execute();

  await db.schema
    .createTable('registrations')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('driver_id', 'integer', col => col.notNull().references('drivers.id'))
    .addColumn('season_id', 'integer', col => col.notNull().references('seasons.id'))
    .$call(withTimestamps)
    .execute();

  await db.schema
    .createTable('races')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('name', 'varchar(50)', col => col.notNull())
    .addColumn('league_id', 'integer', col => col.notNull().references('leagues.id'))
    .addColumn('season_id', 'integer', col => col.notNull().references('seasons.id'))
    .addColumn('week', 'integer', col => col.notNull())
    .addColumn('time', 'timestamptz', col => col.notNull())
    .$call(withTimestamps)
    .execute();

  await db.schema
    .createTable('incidents')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('race_id', 'integer', col => col.notNull().references('races.id'))
    .addColumn('driver_id', 'integer', col => col.notNull().references('drivers.id'))
    .addColumn('reporting_driver_id', 'integer', col => col.notNull().references('drivers.id'))
    .addColumn('lap_number', 'integer', col => col.notNull())
    .addColumn('description', 'varchar(255)', col => col.notNull())
    .$call(withTimestamps)
    .execute();

  await db.schema
    .createTable('rulings')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('incident_id', 'integer', col => col.notNull().references('incidents.id'))
    .addColumn('penalty_id', 'integer', col => col.notNull().references('penalties.id'))
    .$call(withTimestamps)
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('rulings').execute();
  await db.schema.dropTable('incidents').execute();
  await db.schema.dropTable('races').execute();
  await db.schema.dropTable('registrations').execute();
  await db.schema.dropTable('seasons').execute();
  await db.schema.dropTable('drivers').execute();
  await db.schema.dropTable('penalties').execute();
  await db.schema.dropTable('leagues').execute();
  await db.schema.dropTable('platforms').execute();
}
