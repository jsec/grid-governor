import { fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { mockInvitation, mockSession, server } from './msw';
import { renderRoute } from './render-route';

describe('invitation route', () => {
    it('should redirect unauthenticated visitors to sign-in with the invitation path', async () => {
        mockSession();
        const router = renderRoute('/invitations/invite-123');

        await waitFor(() => expect(router.state.location.pathname).toBe('/sign-in'));
        expect(router.state.location.search).toEqual({ returnTo: '/invitations/invite-123' });
    });

    it('should load and accept an invitation as its signed-in recipient', async () => {
        mockSession('member@example.com');
        mockInvitation('member@example.com');
        let acceptedInvitation = '';
        server.use(http.post('*/api/auth/organization/accept-invitation', async ({ request }) => {
            acceptedInvitation = await request.text();

            return HttpResponse.json({
                invitation: { id: 'invite-123', status: 'accepted' },
                member: { id: 'member-1' },
            });
        }));
        renderRoute('/invitations/invite-123');

        const organizationName = await screen.findByText(/Club/);

        expect(organizationName).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /accept invitation/i }));

        const acceptedMessage = await screen.findByText(/invitation accepted/i);

        expect(acceptedMessage).toBeInTheDocument();
        expect(acceptedInvitation).toBe('{"invitationId":"invite-123"}');
    });

    it('should not accept an invitation for a different signed-in user', async () => {
        mockSession('other@example.com');
        server.use(http.get('*/api/auth/organization/get-invitation', () =>
            HttpResponse.json({
                code: 'YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION',
                message: 'You are not the recipient of the invitation',
            }, { status: 403 })));
        let isAcceptRequested = false;
        server.use(http.post('*/api/auth/organization/accept-invitation', () => {
            isAcceptRequested = true;

            return HttpResponse.json({});
        }));
        const router = renderRoute('/invitations/invite-123');

        const alert = await screen.findByRole('alert');

        expect(alert).toHaveTextContent(/not the recipient/i);
        fireEvent.click(screen.getByRole('link', { name: /sign in with a different account/i }));

        await waitFor(() => expect(router.state.location.pathname).toBe('/sign-in'));
        expect(router.state.location.search).toEqual({ returnTo: '/invitations/invite-123' });
        expect(isAcceptRequested).toBe(false);
    });

    it('should clear the accepted state when navigating to another invitation', async () => {
        mockSession('member@example.com');
        mockInvitation('member@example.com');
        server.use(http.post('*/api/auth/organization/accept-invitation', () =>
            HttpResponse.json({
                invitation: { id: 'first', status: 'accepted' },
                member: { id: 'member-1' },
            })));
        const router = renderRoute('/invitations/first');

        const acceptButton = await screen.findByRole('button', { name: /accept invitation/i });
        fireEvent.click(acceptButton);
        await screen.findByText(/invitation accepted/i);

        mockInvitation('member@example.com', { error: 'Invitation not found' });
        await router.navigate({
            params: { invitationId: 'second' },
            to: '/invitations/$invitationId',
        });

        const alert = await screen.findByRole('alert');
        const staleAcceptButton = screen.queryByRole('button', { name: /accept invitation/i });

        expect(alert).toHaveTextContent('Invitation not found');
        expect(screen.queryByText(/invitation accepted/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/You have been invited/)).not.toBeInTheDocument();
        expect(staleAcceptButton).not.toBeInTheDocument();
    });

    it('should show missing or expired invitation errors', async () => {
        mockSession('member@example.com');
        mockInvitation('member@example.com', { error: 'Invitation expired' });
        renderRoute('/invitations/missing');

        const message = await screen.findByText(/invitation expired/i);

        expect(message).toBeInTheDocument();
        expect(screen.queryByText(/invitation accepted/i)).not.toBeInTheDocument();
    });

    it('should not show success when acceptance fails', async () => {
        mockSession('member@example.com');
        mockInvitation('member@example.com');
        server.use(http.post('*/api/auth/organization/accept-invitation', () => HttpResponse.json(
            { code: 'INVITATION_EXPIRED', message: 'Invitation expired' },
            { status: 400 },
        )));
        renderRoute('/invitations/invite-123');

        const acceptButton = await screen.findByRole('button', { name: /accept invitation/i });
        fireEvent.click(acceptButton);

        const message = await screen.findByText(/invitation expired/i);

        expect(message).toBeInTheDocument();
        expect(screen.queryByText(/invitation accepted/i)).not.toBeInTheDocument();
    });
});
