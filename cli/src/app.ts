import { buildApplication, buildRouteMap } from "@stricli/core";
import { buildInstallCommand, buildUninstallCommand } from "@stricli/auto-complete";
import { version, description } from "../package.json";
import { createAdminCommand } from "./commands/create-admin/command";

const routes = buildRouteMap({
    routes: {
        "create-admin": createAdminCommand,
        install: buildInstallCommand("gg", { bash: "__gg_bash_complete" }),
        uninstall: buildUninstallCommand("gg", { bash: true }),
    },
    docs: {
        brief: description,
        hideRoute: {
            install: true,
            uninstall: true,
        },
    },
});

export const app = buildApplication(routes, {
    name: "gg",
    versionInfo: {
        currentVersion: version,
    },
});
