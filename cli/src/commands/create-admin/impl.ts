import { cancel, group, intro, outro, password as promptPassword, spinner, text } from "@clack/prompts";
import { z } from "zod";
import { createAuth } from "@grid-governor/core/auth";
import { loadConfig } from "@grid-governor/core/config/config";
import { createDatabase } from "@grid-governor/core/db/client";
import type { LocalContext } from "../../context";

interface CreateAdminFlags {
    readonly name?: string;
}

function validateEmail(value: string | undefined): string | undefined {
    if (!z.email().safeParse(value).success) {
        return "Invalid email";
    }
}

function validateName(value: string | undefined): string | undefined {
    if (value) {
        return undefined;
    }
    return "Required";
}

function validatePassword(value: string | undefined): string | undefined {
    if (value && value.length >= 8) {
        return undefined;
    }
    return "Must be at least 8 characters";
}

export default async function createAdmin(this: LocalContext, flags: CreateAdminFlags, email?: string): Promise<void> {
    const config = loadConfig();

    if (email !== undefined) {
        const emailError = validateEmail(email);

        if (emailError) {
            throw new Error(emailError);
        }
    }

    intro("Create admin user");
    const answers = await group(
        {
            email: async () => email ?? text({ message: "Email", validate: validateEmail }),
            name: async () => flags.name ?? text({ message: "Name", validate: validateName }),
            password: () => promptPassword({ message: "Password", validate: validatePassword }),
        },
        {
            onCancel: () => {
                cancel("Cancelled");
                this.process.exit(1);
            },
        },
    );

    const spin = spinner();
    spin.start("Creating user");

    const db = createDatabase(config.databaseUrl);

    try {
        const auth = createAuth(db, config);
        const { user } = await auth.api.createUser({
            body: { 
                ...answers, 
                role: "admin" 
            },
        });
        spin.stop(`Created ${user.email} (${user.id})`);
        outro("Done");
    } catch (error) {
        spin.error("Failed to create user");
        throw error;
    } finally {
        await db.destroy();
    }
}
