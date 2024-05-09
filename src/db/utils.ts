import { type CreateTableBuilder, sql } from 'kysely';

export function withTimestamps<TB extends string, C extends string = never>(
  qb: CreateTableBuilder<TB, C>
): CreateTableBuilder<TB, C> {
  return qb
    .addColumn('created_at', 'timestamp', col => col.defaultTo(sql `CURRENT_TIMESTAMP`).notNull())
    .addColumn('updated_at', 'timestamp', col => col.defaultTo(sql `CURRENT_TIMESTAMP`).notNull());
}
