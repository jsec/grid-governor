import { fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { mockMemberRole, mockSession, server } from './msw';
import { renderRoute } from './render-route';

function mockOrganizations(names: string[]) {
    server.use(http.get('*/api/auth/organization/list', () => HttpResponse.json(
        names.map((name, index) => ({
            createdAt: '2026-10-01T12:00:00.000Z',
            id: `org-${index + 1}`,
            name,
            slug: name.toLowerCase().replaceAll(' ', '-'),
        })),
    )));
}

describe('home route', () => {
    it('should redirect signed-out visitors to sign-in', async () => {
        mockSession();
        const router = renderRoute('/');

        await waitFor(() => expect(router.state.location.pathname).toBe('/sign-in'));
        expect(router.state.location.search).toEqual({ returnTo: '/' });
    });

    it('should list the organizations and link to their leagues', async () => {
        mockSession('member@example.com');
        mockOrganizations(['Grid Club']);
        mockMemberRole('member');
        server.use(http.get('*/api/organizations/org-1/leagues', () =>
            HttpResponse.json({ leagues: [] })));
        const router = renderRoute('/');

        const gridClubLink = await screen.findByRole('link', { name: 'Grid Club' });
        fireEvent.click(gridClubLink);

        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/organizations/org-1/leagues');
        });
    });

    it('should say so when the user has no organizations', async () => {
        mockSession('member@example.com');
        mockOrganizations([]);
        renderRoute('/');

        const message = await screen.findByText(/aren't a member of any organization/);

        expect(message).toBeInTheDocument();
    });
});
