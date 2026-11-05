import { roundListSchema } from '@grid-governor/core/schemas';
import { queryOptions } from '@tanstack/react-query';

import { api } from '../lib/api';

export function roundListQuery(seasonId: string) {
    return queryOptions({
        queryFn: () => api.get(`seasons/${seasonId}/rounds`).json(roundListSchema),
        queryKey: ['seasons', seasonId, 'rounds'],
    });
}
