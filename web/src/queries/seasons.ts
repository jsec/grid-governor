import { seasonListSchema, seasonSchema } from '@grid-governor/core/schemas';
import { queryOptions } from '@tanstack/react-query';

import { api } from '../lib/api';

export function seasonListQuery(leagueId: string) {
    return queryOptions({
        queryFn: () => api.get(`leagues/${leagueId}/seasons`).json(seasonListSchema),
        queryKey: ['leagues', leagueId, 'seasons'],
    });
}

export function seasonQuery(seasonId: string) {
    return queryOptions({
        queryFn: () => api.get(`seasons/${seasonId}`).json(seasonSchema),
        queryKey: ['seasons', seasonId],
    });
}
