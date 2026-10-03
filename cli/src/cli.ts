#!/usr/bin/env node
import { cancel, group, intro, outro, password, spinner, text } from '@clack/prompts';
import { createAuth } from '@grid-governor/core/auth';
import { loadConfig } from '@grid-governor/core/config/config';
import { createDatabase } from '@grid-governor/core/db/client';
import { defineCommand, runMain } from 'citty';
import { z } from 'zod';

const emailSchema = z.email('Invalid email');
const nameSchema = z.string().min(1, 'Required');
const passwordSchema = z.string().min(8, 'Must be at least 8 characters');

const argsSchema = z.object({
    email: emailSchema.optional(),
    name: nameSchema.optional(),
});

const validateWith = (schema: z.ZodType) => (value: string | undefined) =>
    schema.safeParse(value).error?.issues[0]?.message;

function exitCancelled(message: string): never {
    cancel(message);
    process.exit(1);
}

const createAdmin = defineCommand({
    args: {
        email: { description: 'Email address', required: false, type: 'positional' },
        name: { description: 'Display name', type: 'string' },
    },
    meta: { description: 'Create a new admin user (password is prompted)', name: 'create-admin' },
    async run({ args }) {
        const { data: given, error } = argsSchema.safeParse(args);

        if (error) {
            exitCancelled(z.prettifyError(error));
        }

        const config = loadConfig();

        intro('Create admin user');
        const answers = await group(
            {
                email: async () => given.email ?? text({
                    message: 'Email',
                    validate: validateWith(emailSchema),
                }),
                name: async () => given.name ?? text({
                    message: 'Name',
                    validate: validateWith(nameSchema),
                }),
                password: () => password({
                    message: 'Password',
                    validate: validateWith(passwordSchema),
                }),
            },
            { onCancel: () => exitCancelled('Cancelled') },
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
        } catch (createError) {
            spin.error('Failed to create user');
            throw createError;
        } finally {
            await db.destroy();
        }
    },
});

await runMain(defineCommand({
    meta: { description: 'Grid Governor admin CLI', name: 'gg' },
    subCommands: { 'create-admin': createAdmin },
}));
