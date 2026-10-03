import { buildCommand } from "@stricli/core";

export const createAdminCommand = buildCommand({
    loader: async () => import("./impl"),
    parameters: {
        flags: {
            name: {
                kind: "parsed",
                brief: "Display name",
                parse: String,
                optional: true,
            },
        },
        positional: {
            kind: "tuple",
            parameters: [
                {
                    brief: "Email address",
                    placeholder: "email",
                    parse: String,
                    optional: true,
                },
            ],
        },
    },
    docs: {
        brief: "Create a new admin user (password is prompted)",
    },
});
