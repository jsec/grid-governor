import { fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { safeReturnTo } from '../routes/sign-in';
import { mockInvitation, mockSession, server } from './msw';
import { renderRoute } from './render-route';

describe('sign-in route', () => {
    it('should reject external return URLs', () => {
        expect(safeReturnTo('https://evil.example/path')).toBe('/');
        expect(safeReturnTo('//evil.example/path')).toBe('/');
    });

    it('should post credentials to Better Auth and return to the invitation path', async () => {
        let postedCredentials: string | undefined;
        server.use(http.post('*/api/auth/sign-in/email', async ({ request }) => {
            postedCredentials = await request.text();

            return HttpResponse.json({
                token: 'session-token',
                user: {
                    createdAt: new Date().toISOString(),
                    email: 'member@example.com',
                    emailVerified: true,
                    id: 'user-1',
                    name: 'Member',
                    updatedAt: new Date().toISOString(),
                },
            });
        }));
        mockSession('member@example.com');
        mockInvitation('member@example.com');
        const router = renderRoute('/sign-in?returnTo=%2Finvitations%2Finvite-123');

        const emailField = await screen.findByLabelText(/email/i);
        fireEvent.change(emailField, {
            target: { value: 'member@example.com' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => expect(router.state.location.pathname).toBe('/invitations/invite-123'));

        const message = await screen.findByText(/invited to Club/);

        expect(message).toBeInTheDocument();
        expect(postedCredentials).toBe('{"email":"member@example.com","password":"secret"}');
    });
});
