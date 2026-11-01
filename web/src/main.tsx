import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { queryClient, router } from './lib/router';

const rootElement = document.querySelector('#root');

if (!rootElement) {
    throw new Error('root element missing');
}

createRoot(rootElement).render(
    <StrictMode>
        <MantineProvider>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>
        </MantineProvider>
    </StrictMode>,
);
