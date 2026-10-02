import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { authClient } from '../../auth-client';

export const Route = createFileRoute('/invitations/$invitationId')({ component: InvitationRoute });

type InvitationDetailsProps = {
    invitationId: string;
    navigate: (returnTo: string) => void;
    userId: string;
};

type InvitationPageProps = {
    invitationId: string;
    navigate: (returnTo: string) => void;
};

export function InvitationPage({ invitationId, navigate }: InvitationPageProps) {
    const session = authClient.useSession();
    const user = session.data?.user;

    useEffect(() => {
        if (!user && !session.isPending) {
            navigate(`/invitations/${encodeURIComponent(invitationId)}`);
        }
    }, [invitationId, navigate, session.isPending, user]);

    if (session.isPending) {
        return <main><p>Loading invitation…</p></main>;
    }
    if (!user) {
        return <main><p>Redirecting to sign in…</p></main>;
    }

    return (
        <InvitationDetails
            invitationId={invitationId}
            key={`${user.id}:${invitationId}`}
            navigate={navigate}
            userId={user.id}
        />
    );
}

function InvitationDetails({ invitationId, navigate, userId }: InvitationDetailsProps) {
    const query = useQuery({
        queryFn: () => authClient.organization.getInvitation({ query: { id: invitationId } }),
        queryKey: ['invitation', userId, invitationId],
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
                    <button
                        onClick={() => navigate(`/invitations/${encodeURIComponent(invitationId)}`)}
                        type="button"
                    >
                        Sign in with a different account
                    </button>
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

function InvitationRoute() {
    const { invitationId } = Route.useParams();
    const navigate = useNavigate();

    return (
        <InvitationPage
            invitationId={invitationId}
            navigate={returnTo => void navigate({ search: { returnTo }, to: '/sign-in' })}
        />
    );
}
