import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, redirect, useLocation } from '@tanstack/react-router';

import { authClient } from '../../auth-client';

export const Route = createFileRoute('/invitations/$invitationId')({
    beforeLoad: async ({ location }) => {
        const { data } = await authClient.getSession();
        if (!data) {
            throw redirect({ search: { returnTo: location.href }, to: '/sign-in' });
        }
        return { user: data.user };
    },
    component: InvitationRoute,
    remountDeps: ({ params }) => params,
});

function InvitationRoute() {
    const { invitationId } = Route.useParams();
    const { user } = Route.useRouteContext();
    const returnTo = useLocation({ select: location => location.href });
    const query = useQuery({
        queryFn: () => authClient.organization.getInvitation({ query: { id: invitationId } }),
        queryKey: ['invitation', user.id, invitationId],
        retry: false,
    });
    const acceptance = useMutation({
        mutationFn: async () => {
            const result = await authClient.organization.acceptInvitation({ invitationId });
            if (result.error) {
                throw new Error(result.error.message ?? 'Unable to accept invitation.');
            }
            return result.data;
        },
    });

    if (query.isPending) {
        return <main><p>Loading invitation…</p></main>;
    }

    const invitation = query.data?.data;
    const loadError = query.data?.error ?? query.error;

    if (!invitation) {
        return (
            <main>
                <h1>Invitation unavailable</h1>
                <p role="alert">{loadError?.message ?? 'Invitation not found.'}</p>
                {query.data?.error?.status === 403 && (
                    <Link search={{ returnTo }} to="/sign-in">
                        Sign in with a different account
                    </Link>
                )}
            </main>
        );
    }

    return (
        <main>
            <h1>Organization invitation</h1>
            <p>{`You have been invited to ${invitation.organizationName}.`}</p>
            {acceptance.error && <p role="alert">{acceptance.error.message}</p>}
            {acceptance.isSuccess && <p>Invitation accepted.</p>}
            {!acceptance.isSuccess && (
                <button
                    disabled={acceptance.isPending}
                    onClick={() => acceptance.mutate()}
                    type="button"
                >
                    {acceptance.isPending ? 'Accepting…' : 'Accept invitation'}
                </button>
            )}
        </main>
    );
}
