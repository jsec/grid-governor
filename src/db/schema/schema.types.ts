import type { ColumnType } from 'kysely';

export type Timestamp = ColumnType<Date, string | undefined, never>;

export type DateTime = ColumnType<Date, string, string>;
