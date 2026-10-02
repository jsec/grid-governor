import { QueryClient } from '@tanstack/react-query';
import { z } from 'zod';

const clientErrorSchema = z.object({
    status: z.number().gte(400)
        .lt(500),
});

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error) => {
                if (clientErrorSchema.safeParse(error).success) {
                    return false;
                }

                return failureCount < 2;
            },
            staleTime: 30_000,
        },
    },
});
