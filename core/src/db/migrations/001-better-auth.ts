import type { Kysely } from 'kysely';

import { sql } from 'kysely';

export async function down(db: Kysely<unknown>): Promise<void> {
    await db.schema.dropTable('verification').execute();
    await db.schema.dropTable('account').execute();
    await db.schema.dropTable('session').execute();
    await db.schema.dropTable('user').execute();
}

export async function up(db: Kysely<unknown>): Promise<void> {
    await db.schema
        .createTable('user')
        .addColumn('id', 'text', column => column.primaryKey())
        .addColumn('name', 'text', column => column.notNull())
        .addColumn('email', 'text', column => column.notNull().unique())
        .addColumn('email_verified', 'boolean', column =>
            column.notNull().defaultTo(false),
        )
        .addColumn('image', 'text')
        .addColumn('created_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addColumn('updated_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .execute();

    await db.schema
        .createTable('session')
        .addColumn('id', 'text', column => column.primaryKey())
        .addColumn('expires_at', 'timestamptz', column => column.notNull())
        .addColumn('token', 'text', column => column.notNull().unique())
        .addColumn('created_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addColumn('updated_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addColumn('ip_address', 'text')
        .addColumn('user_agent', 'text')
        .addColumn('active_organization_id', 'text')
        .addColumn('user_id', 'text', column =>
            column
                .notNull()
                .references('user.id')
                .onDelete('cascade'),
        )
        .execute();

    await db.schema
        .createTable('account')
        .addColumn('id', 'text', column => column.primaryKey())
        .addColumn('account_id', 'text', column => column.notNull())
        .addColumn('provider_id', 'text', column => column.notNull())
        .addColumn('issuer', 'text', column => column.notNull())
        .addColumn('user_id', 'text', column =>
            column
                .notNull()
                .references('user.id')
                .onDelete('cascade'),
        )
        .addColumn('access_token', 'text')
        .addColumn('refresh_token', 'text')
        .addColumn('id_token', 'text')
        .addColumn('access_token_expires_at', 'timestamptz')
        .addColumn('refresh_token_expires_at', 'timestamptz')
        .addColumn('scope', 'text')
        .addColumn('password', 'text')
        .addColumn('created_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addColumn('updated_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addUniqueConstraint('account_issuer_account_id_key', [
            'issuer',
            'account_id',
        ])
        .execute();

    await db.schema
        .createTable('verification')
        .addColumn('id', 'text', column => column.primaryKey())
        .addColumn('identifier', 'text', column => column.notNull())
        .addColumn('value', 'text', column => column.notNull())
        .addColumn('expires_at', 'timestamptz', column => column.notNull())
        .addColumn('created_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addColumn('updated_at', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .execute();
}
