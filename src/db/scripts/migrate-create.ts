import { writeFileSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_TEMPLATE = `import { type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
}

export async function down(db: Kysely<any>): Promise<void> {
}
`;

const migrationName = process.argv[2];

if (!migrationName) {
  console.error('You must supply a migration name.');
  process.exit(1);
}

const dateStr = new Date().toISOString()
  .replaceAll(/[:-]/g, '')
  .replaceAll('T', '')
  .split('.')[0];

const filename = `${dateStr}-${migrationName}.ts`;
const filePath = path.join(import.meta.dirname, '..', 'migrations', filename);

writeFileSync(filePath, DEFAULT_TEMPLATE, 'utf8');
console.log('Created migration:', filename);
