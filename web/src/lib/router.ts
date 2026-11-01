import type { RouterHistory } from '@tanstack/react-router';

import { QueryClient } from '@tanstack/react-query';
import { createRouter, isNotFound } from '@tanstack/react-router';
import { HTTPError } from 'ky';

import { routeTree } from '../routeTree.gen';
import { NotFound, Pending, RouteError } from './route-error';

const MAX_QUERY_RETRIES = 2;

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error) => {
                if (isNotFound(error)) {
                    return false;
                }

                if (error instanceof HTTPError && error.response.status < 500) {
                    return false;
                }

                return failureCount < MAX_QUERY_RETRIES;
            },
        },
    },
});

export function createAppRouter(queryClient: QueryClient, history?: RouterHistory) {
    return createRouter({
        context: { queryClient },
        defaultErrorComponent: RouteError,
        defaultNotFoundComponent: NotFound,
        defaultPendingComponent: Pending,
        defaultPreload: 'intent',
        defaultPreloadStaleTime: 0,
        history,
        routeTree,
    });
}

export const router = createAppRouter(queryClient);

declare module '@tanstack/react-router' {
    // Must be an interface: this merges with the library's Register declaration.
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Register {
        router: typeof router;
    }
}
