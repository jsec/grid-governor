import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error) => {
                // No retry on 4xx. The problem-details envelope carries the status.
                const status = (error as { status?: number }).status;
                if (status !== undefined && status >= 400 && status < 500) return false;
                return failureCount < 2;
            },
            staleTime: 30_000,
        },
    },
});
