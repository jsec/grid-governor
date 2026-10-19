import { queryOptions } from '@tanstack/react-query';

import { authClient } from '../auth-client';

export function memberRoleQuery(organizationId: string) {
    return queryOptions({
        queryFn: async () => {
            const { data, error } = await authClient.organization.getActiveMemberRole({
                query: { organizationId },
            });

            if (error) {
                throw new Error(error.message ?? error.statusText);
            }

            return data.role;
        },
        queryKey: ['organizations', organizationId, 'role'],
    });
}

export function organizationListQuery() {
    return queryOptions({
        queryFn: async () => {
            const { data, error } = await authClient.organization.list();

            if (error) {
                throw new Error(error.message ?? error.statusText);
            }

            return data;
        },
        queryKey: ['organizations'],
    });
}
