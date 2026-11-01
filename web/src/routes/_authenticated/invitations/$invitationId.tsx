import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useLocation } from '@tanstack/react-router';

import { authClient } from '../../../auth-client';

export const Route = createFileRoute('/_authenticated/invitations/$invitationId')({
    component: InvitationRoute,
    remountDeps: ({ params }) => params,
});

function InvitationRoute() {
    const { invitationId } = Route.useParams();
    const { user } = Route.useRouteContext();
    const returnTo = useLocation({ select: location => location.href });
    const invitationQuery = useQuery({
        queryFn: () => authClient.organization.getInvitation({ query: { id: invitationId } }),
        queryKey: ['invitation', user.id, invitationId],
        retry: false,
    });
    const acceptance = useMutation({
        mutationFn: async () => {
            const accepted = await authClient.organization.acceptInvitation({ invitationId });

            if (accepted.error) {
                throw new Error(accepted.error.message ?? 'Unable to accept invitation.');
            }

            return accepted.data;
        },
    });

    if (invitationQuery.isPending) {
        return <main><p>Loading invitation…</p></main>;
    }

    const invitation = invitationQuery.data?.data;
    const loadError = invitationQuery.data?.error ?? invitationQuery.error;

    if (!invitation) {
        return (
            <main>
                <h1>Invitation unavailable</h1>
                <p role="alert">{loadError?.message ?? 'Invitation not found.'}</p>
                {invitationQuery.data?.error?.status === 403 && (
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
