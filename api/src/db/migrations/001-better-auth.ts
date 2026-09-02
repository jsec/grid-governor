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
        .addColumn('emailVerified', 'boolean', column =>
            column.notNull().defaultTo(false),
        )
        .addColumn('image', 'text')
        .addColumn('createdAt', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addColumn('updatedAt', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .execute();

    await db.schema
        .createTable('session')
        .addColumn('id', 'text', column => column.primaryKey())
        .addColumn('expiresAt', 'timestamptz', column => column.notNull())
        .addColumn('token', 'text', column => column.notNull().unique())
        .addColumn('createdAt', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addColumn('updatedAt', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addColumn('ipAddress', 'text')
        .addColumn('userAgent', 'text')
        .addColumn('userId', 'text', column =>
            column.notNull().references('user.id').onDelete('cascade'),
        )
        .execute();

    await db.schema
        .createTable('account')
        .addColumn('id', 'text', column => column.primaryKey())
        .addColumn('accountId', 'text', column => column.notNull())
        .addColumn('providerId', 'text', column => column.notNull())
        .addColumn('issuer', 'text', column => column.notNull())
        .addColumn('userId', 'text', column =>
            column.notNull().references('user.id').onDelete('cascade'),
        )
        .addColumn('accessToken', 'text')
        .addColumn('refreshToken', 'text')
        .addColumn('idToken', 'text')
        .addColumn('accessTokenExpiresAt', 'timestamptz')
        .addColumn('refreshTokenExpiresAt', 'timestamptz')
        .addColumn('scope', 'text')
        .addColumn('password', 'text')
        .addColumn('createdAt', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addColumn('updatedAt', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addUniqueConstraint('account_issuer_account_id_key', [
            'issuer',
            'accountId',
        ])
        .execute();

    await db.schema
        .createTable('verification')
        .addColumn('id', 'text', column => column.primaryKey())
        .addColumn('identifier', 'text', column => column.notNull())
        .addColumn('value', 'text', column => column.notNull())
        .addColumn('expiresAt', 'timestamptz', column => column.notNull())
        .addColumn('createdAt', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .addColumn('updatedAt', 'timestamptz', column =>
            column.notNull().defaultTo(sql`now()`),
        )
        .execute();
}
