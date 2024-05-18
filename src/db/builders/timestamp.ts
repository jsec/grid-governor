import { type CreateTableBuilder, sql } from 'kysely';

export function withTimestamps<TB extends string, C extends string = never>(
  qb: CreateTableBuilder<TB, C>
): CreateTableBuilder<TB, C> {
  return qb
    .addColumn('created_at', 'timestamptz', col => col.defaultTo(sql `CURRENT_TIMESTAMP`).notNull())
    // eslint-disable-next-line @stylistic/max-len
    .addColumn('updated_at', 'timestamptz', col => col.defaultTo(sql `CURRENT_TIMESTAMP`).notNull());
}
