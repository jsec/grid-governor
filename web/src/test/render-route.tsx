import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { render } from '@testing-library/react';

import { authClient } from '../auth-client';
import { routeTree } from '../routeTree.gen';

export function renderRoute(path: string) {
    authClient.$store.notify('$sessionSignal');

    const router = createRouter({
        history: createMemoryHistory({ initialEntries: [path] }),
        routeTree,
    });
    const queryClient = new QueryClient({
        defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });

    render(
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>,
    );

    return router;
}
