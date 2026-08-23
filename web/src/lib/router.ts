import { createRouter } from '@tanstack/react-router';

import { routeTree } from '../routeTree.gen';
import { queryClient } from './query-client';

/*
 * queryClient lives in the router context so loaders can prefetch via
 * queryClient.ensureQueryData before a route renders.
 */
export const router = createRouter({
    context: { queryClient },
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
