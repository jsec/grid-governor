import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { safeReturnTo, SignInPage } from '../routes/sign-in';
import { server } from './msw';

describe('sign-in route', () => {
    it('rejects external return URLs', () => {
        expect(safeReturnTo('https://evil.example/path')).toBe('/');
        expect(safeReturnTo('//evil.example/path')).toBe('/');
    });

    it('posts credentials to Better Auth and returns to the internal invitation path', async () => {
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
        const returnTo = '/invitations/invite-123';
        let destination = '';
        const navigate = (to: string) => {
            destination = to;
        };
        render(<SignInPage navigate={navigate} returnTo={returnTo} />);

        const emailInput = screen.getByLabelText(/email/i);
        fireEvent.change(emailInput, { target: { value: 'member@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => expect(destination).toBe(returnTo));
        expect(postedCredentials).toBe('{"email":"member@example.com","password":"secret"}');
    });
});
