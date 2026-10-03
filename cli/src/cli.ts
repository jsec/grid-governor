#!/usr/bin/env node
import { cancel, group, intro, outro, password, spinner, text } from '@clack/prompts';
import { createAuth } from '@grid-governor/core/auth';
import { loadConfig } from '@grid-governor/core/config/config';
import { createDatabase } from '@grid-governor/core/db/client';
import { buildApplication, buildCommand, buildRouteMap, run } from '@stricli/core';
import { z } from 'zod';

const emailSchema = z.email('Invalid email');
const nameSchema = z.string().min(1, 'Required');
const passwordSchema = z.string().min(8, 'Must be at least 8 characters');

// @clack/prompts validators return the error message, or nothing when the value is valid.
const validateWith = (schema: z.ZodType) => (value: string | undefined) =>
    schema.safeParse(value).error?.issues[0]?.message;

const parseWith = (schema: z.ZodType<string>) => (value: string) => {
    const { data, error } = schema.safeParse(value);

    if (error) {
        throw new Error(z.prettifyError(error));
    }

    return data;
};

const createAdmin = buildCommand({
    docs: { brief: 'Create a new admin user (password is prompted)' },
    async func(flags: { readonly name?: string }, email?: string) {
        const config = loadConfig();

        intro('Create admin user');
        const answers = await group(
            {
                email: async () => email ?? text({
                    message: 'Email',
                    validate: validateWith(emailSchema),
                }),
                name: async () => flags.name ?? text({
                    message: 'Name',
                    validate: validateWith(nameSchema),
                }),
                password: () => password({
                    message: 'Password',
                    validate: validateWith(passwordSchema),
                }),
            },
            {
                onCancel: () => {
                    cancel('Cancelled');
                    process.exit(1);
                },
            },
        );

        const spin = spinner();
        spin.start('Creating user');

        const db = createDatabase(config.DATABASE_URL);

        try {
            const { user } = await createAuth(db, config).api.createUser({
                body: { ...answers, role: 'admin' },
            });
            spin.stop(`Created ${user.email} (${user.id})`);
            outro('Done');
        } catch (error) {
            spin.error('Failed to create user');
            throw error;
        } finally {
            await db.destroy();
        }
    },
    parameters: {
        flags: {
            name: {
                brief: 'Display name',
                kind: 'parsed',
                optional: true,
                parse: parseWith(nameSchema),
            },
        },
        positional: {
            kind: 'tuple',
            parameters: [{
                brief: 'Email address',
                optional: true,
                parse: parseWith(emailSchema),
                placeholder: 'email',
            }],
        },
    },
});

const app = buildApplication(
    buildRouteMap({
        docs: { brief: 'Grid Governor admin CLI' },
        routes: { 'create-admin': createAdmin },
    }),
    { name: 'gg' },
);

await run(app, process.argv.slice(2), { process });
