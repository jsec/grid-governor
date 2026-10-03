import { createRouter } from '@tanstack/react-router';

import { routeTree } from '../routeTree.gen';

export const router = createRouter({
    defaultPreload: 'intent',
    routeTree,
});

declare module '@tanstack/react-router' {
    // Must be an interface: this merges with the library's Register declaration.
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Register {
        router: typeof router;
    }
}
