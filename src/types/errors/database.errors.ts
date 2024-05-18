export enum PostgresErrorCode {
  ForeignKeyViolation = '23503'
}

export interface PostgresError {
  code: PostgresErrorCode,
  column?: string,
  detail: string,
  table: string,
}

