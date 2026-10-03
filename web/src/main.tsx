import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { router } from './lib/router';

const queryClient = new QueryClient();

const rootElement = document.querySelector('#root');
if (!rootElement) {
    throw new Error('root element missing');
}

createRoot(rootElement).render(
    <StrictMode>
        <MantineProvider>
            <QueryClientProvider client={queryClient}>
                <Notifications />
                <RouterProvider router={router} />
            </QueryClientProvider>
        </MantineProvider>
    </StrictMode>,
);
