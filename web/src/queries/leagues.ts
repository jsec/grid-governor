import { leagueListSchema, leagueSchema } from '@grid-governor/core/schemas';
import { queryOptions } from '@tanstack/react-query';

import { api } from '../lib/api';

export function leagueListQuery(organizationId: string) {
    return queryOptions({
        queryFn: () => api.get(`organizations/${organizationId}/leagues`).json(leagueListSchema),
        queryKey: ['organizations', organizationId, 'leagues'],
    });
}

export function leagueQuery(leagueId: string) {
    return queryOptions({
        queryFn: () => api.get(`leagues/${leagueId}`).json(leagueSchema),
        queryKey: ['leagues', leagueId],
    });
}
