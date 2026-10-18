import { createFileRoute, redirect } from '@tanstack/react-router';

import { authClient } from '../auth-client';

export const Route = createFileRoute('/_authenticated')({
    beforeLoad: async ({ location }) => {
        const { data } = await authClient.getSession();

        if (!data) {
            throw redirect({ search: { returnTo: location.href }, to: '/sign-in' });
        }
    },
});
