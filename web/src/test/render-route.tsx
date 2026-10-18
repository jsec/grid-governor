import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { render } from '@testing-library/react';

import { authClient } from '../auth-client';
import { createAppRouter } from '../lib/router';

export function renderRoute(path: string) {
    authClient.$store.notify('$sessionSignal');

    const queryClient = new QueryClient({
        defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const router = createAppRouter(queryClient, createMemoryHistory({ initialEntries: [path] }));

    render(
        <MantineProvider>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>
        </MantineProvider>,
    );

    return router;
}
