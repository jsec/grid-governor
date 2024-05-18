export enum PostgresErrorCode {
  ForeignKeyViolation = '23503'
}

export interface DatabaseError {
  code: PostgresErrorCode,
  column?: string,
  detail: string,
  table: string,
}

