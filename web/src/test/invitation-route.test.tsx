import type { ComponentProps } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { authClient } from '../auth-client';
import { InvitationPage } from '../routes/invitations/$invitationId';
import { server } from './msw';

function createNavigationRecorder() {
    const destinations: string[] = [];
    return {
        destinations,
        navigate: (destination: string) => {
            destinations.push(destination);
        },
    };
}

function mockInvitation(email: string, options: { error?: string } = {}) {
    server.use(http.get('*/api/auth/organization/get-invitation', ({ request }) => {
        if (options.error) {
            return HttpResponse.json(
                { code: 'INVITATION_NOT_FOUND', message: options.error },
                { status: 404 },
            );
        }
        const id = new URL(request.url).searchParams.get('id');
        return HttpResponse.json({
            createdAt: new Date().toISOString(),
            email,
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
            id,
            inviterEmail: 'owner@example.com',
            inviterId: 'owner-1',
            organizationId: 'org-1',
            organizationName: 'Club',
            organizationSlug: 'club',
            role: 'member',
            status: 'pending',
        });
    }));
}

function mockSession(email?: string) {
    server.use(http.get('*/api/auth/get-session', () => {
        if (!email) {
            return HttpResponse.json(null);
        }
        const timestamp = new Date().toISOString();
        return HttpResponse.json({
            session: {
                createdAt: timestamp,
                expiresAt: timestamp,
                id: 'session-1',
                token: 'session-token',
                updatedAt: timestamp,
                userId: 'user-1',
            },
            user: {
                createdAt: timestamp,
                email,
                emailVerified: true,
                id: 'user-1',
                name: 'Member',
                updatedAt: timestamp,
            },
        });
    }));
}

function renderInvitation(props: ComponentProps<typeof InvitationPage>) {
    // authClient caches the session across tests; refetch it from this test's handler.
    authClient.$store.notify('$sessionSignal');
    const client = new QueryClient({
        defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    return render(<InvitationPage {...props} />, {
        wrapper: ({ children }) => (
            <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
    });
}

describe('invitation route', () => {
    it('redirects unauthenticated visitors to sign-in with the invitation path', async () => {
        mockSession();
        const navigation = createNavigationRecorder();
        renderInvitation({
            invitationId: 'invite-123',
            navigate: navigation.navigate,
        });

        await waitFor(() => expect(navigation.destinations).toEqual(['/invitations/invite-123']));
    });

    it('loads and accepts an invitation as its signed-in recipient', async () => {
        mockSession('member@example.com');
        mockInvitation('member@example.com');
        const navigation = createNavigationRecorder();
        let acceptedInvitation = '';
        server.use(http.post('*/api/auth/organization/accept-invitation', async ({ request }) => {
            acceptedInvitation = await request.text();
            return HttpResponse.json({
                invitation: { id: 'invite-123', status: 'accepted' },
                member: { id: 'member-1' },
            });
        }));
        renderInvitation({
            invitationId: 'invite-123',
            navigate: navigation.navigate,
        });

        expect(await screen.findByText(/Club/)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /accept invitation/i }));

        expect(await screen.findByText(/invitation accepted/i)).toBeInTheDocument();
        expect(acceptedInvitation).toBe('{"invitationId":"invite-123"}');
    });

    it('does not accept an invitation for a different signed-in user', async () => {
        mockSession('other@example.com');
        server.use(http.get('*/api/auth/organization/get-invitation', () =>
            HttpResponse.json({
                code: 'YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION',
                message: 'You are not the recipient of the invitation',
            }, { status: 403 })));
        const navigation = createNavigationRecorder();
        let isAcceptRequested = false;
        server.use(http.post('*/api/auth/organization/accept-invitation', () => {
            isAcceptRequested = true;
            return HttpResponse.json({});
        }));
        renderInvitation({
            invitationId: 'invite-123',
            navigate: navigation.navigate,
        });

        expect(await screen.findByRole('alert')).toHaveTextContent(/not the recipient/i);
        fireEvent.click(screen.getByRole('button', { name: /sign in with a different account/i }));
        expect(isAcceptRequested).toBe(false);
        expect(navigation.destinations).toEqual(['/invitations/invite-123']);
    });

    it('clears accepted invitation state when navigating to a different invitation', async () => {
        mockSession('member@example.com');
        mockInvitation('member@example.com');
        server.use(http.post('*/api/auth/organization/accept-invitation', () =>
            HttpResponse.json({
                invitation: { id: 'first', status: 'accepted' },
                member: { id: 'member-1' },
            })));
        const navigate = createNavigationRecorder().navigate;
        const view = renderInvitation({ invitationId: 'first', navigate });
        fireEvent.click(await screen.findByRole('button', { name: /accept invitation/i }));
        await screen.findByText(/invitation accepted/i);

        mockInvitation('member@example.com', { error: 'Invitation not found' });
        view.rerender(<InvitationPage invitationId="second" navigate={navigate} />);

        expect(screen.queryByText(/invitation accepted/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/You have been invited/)).not.toBeInTheDocument();
        expect(await screen.findByRole('alert')).toHaveTextContent('Invitation not found');
        const acceptButton = screen.queryByRole('button', { name: /accept invitation/i });
        expect(acceptButton).not.toBeInTheDocument();
    });

    it('shows missing or expired invitation errors', async () => {
        mockSession('member@example.com');
        mockInvitation('member@example.com', { error: 'Invitation expired' });
        renderInvitation({
            invitationId: 'missing',
            navigate: createNavigationRecorder().navigate,
        });

        expect(await screen.findByText(/invitation expired/i)).toBeInTheDocument();
        expect(screen.queryByText(/invitation accepted/i)).not.toBeInTheDocument();
    });

    it('does not show success when acceptance fails', async () => {
        mockSession('member@example.com');
        mockInvitation('member@example.com');
        server.use(http.post('*/api/auth/organization/accept-invitation', () => HttpResponse.json(
            { code: 'INVITATION_EXPIRED', message: 'Invitation expired' },
            { status: 400 },
        )));
        renderInvitation({
            invitationId: 'invite-123',
            navigate: createNavigationRecorder().navigate,
        });

        fireEvent.click(await screen.findByRole('button', { name: /accept invitation/i }));
        expect(await screen.findByText(/invitation expired/i)).toBeInTheDocument();
        expect(screen.queryByText(/invitation accepted/i)).not.toBeInTheDocument();
    });
});
