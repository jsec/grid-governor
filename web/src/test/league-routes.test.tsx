import { fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import {
    leagueFixture,
    mockLeagueRoles,
    mockMemberRole,
    mockSeasons,
    mockSession,
    server,
} from './msw';
import { renderRoute } from './render-route';

const listPath = '/organizations/org-1/leagues';

function mockLeague() {
    server.use(http.get('*/api/leagues/1', () =>
        HttpResponse.json(leagueFixture({ banLengthRounds: 2 }))));
}

function mockLeagueList(names: string[]) {
    server.use(http.get('*/api/organizations/org-1/leagues', () => HttpResponse.json({
        leagues: names.map((name, index) => leagueFixture({ id: String(index + 1), name })),
    })));
}

function mockLeagueListError(status: number) {
    server.use(http.get('*/api/organizations/org-1/leagues', () =>
        HttpResponse.json({ error: 'Failed' }, { status })));
}

describe('league list route', () => {
    it('redirects signed-out visitors to sign-in with the page as returnTo', async () => {
        mockSession();
        const router = renderRoute(listPath);

        await waitFor(() => expect(router.state.location.pathname).toBe('/sign-in'));
        expect(router.state.location.search).toEqual({ returnTo: listPath });
    });

    it('redirects to sign-in when the API responds 401', async () => {
        mockSession('member@example.com');
        mockLeagueListError(401);
        const router = renderRoute(listPath);

        await waitFor(() => expect(router.state.location.pathname).toBe('/sign-in'));
        expect(router.state.location.search).toEqual({ returnTo: listPath });
    });

    it('lists the leagues without the create form for a plain member', async () => {
        mockSession('member@example.com');
        mockMemberRole('member');
        mockLeagueList(['Sunday Cup']);
        renderRoute(listPath);

        expect(await screen.findByRole('link', { name: 'Sunday Cup' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Create league' })).not.toBeInTheDocument();
    });

    it('creates a league as an admin and shows it in the list', async () => {
        mockSession('admin@example.com');
        mockMemberRole('admin');
        mockLeagueList([]);
        let created: unknown;
        server.use(http.post('*/api/organizations/org-1/leagues', async ({ request }) => {
            created = await request.json();
            mockLeagueList(['Saturday Cup']);
            return HttpResponse.json(leagueFixture({ name: 'Saturday Cup' }), { status: 201 });
        }));
        renderRoute(listPath);

        fireEvent.change(await screen.findByLabelText(/^Name/), {
            target: { value: 'Saturday Cup' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Create league' }));

        expect(await screen.findByRole('link', { name: 'Saturday Cup' })).toBeInTheDocument();
        expect(created).toEqual({
            banLengthRounds: null,
            name: 'Saturday Cup',
            rulingSlaHours: 24,
            suspensionThresholdPoints: null,
        });
    });

    it('shows the issues from a 400 next to their fields', async () => {
        mockSession('admin@example.com');
        mockMemberRole('admin');
        mockLeagueList([]);
        server.use(http.post('*/api/organizations/org-1/leagues', () => HttpResponse.json({
            error: 'Invalid request',
            issues: [{ message: 'Name is too short', path: ['name'] }],
        }, { status: 400 })));
        renderRoute(listPath);

        fireEvent.change(await screen.findByLabelText(/^Name/), { target: { value: ' ' } });
        fireEvent.click(screen.getByRole('button', { name: 'Create league' }));

        expect(await screen.findByText('Name is too short')).toBeInTheDocument();
    });

    it('shows the no-access view for a 403', async () => {
        mockSession('member@example.com');
        mockLeagueListError(403);
        renderRoute(listPath);

        expect(await screen.findByRole('alert')).toHaveTextContent(/don't have access/);
    });

    it('shows the not-found view for a 404', async () => {
        mockSession('outsider@example.com');
        mockLeagueListError(404);
        renderRoute(listPath);

        expect(await screen.findByRole('heading', { name: 'Not found' })).toBeInTheDocument();
    });

    it('shows an error with a retry for a 500', async () => {
        mockSession('member@example.com');
        mockMemberRole('member');
        mockLeagueListError(500);
        renderRoute(listPath);

        expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't be loaded/);

        mockLeagueList(['Sunday Cup']);
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await screen.findByRole('link', { name: 'Sunday Cup' })).toBeInTheDocument();
    });
});

describe('league route', () => {
    beforeEach(() => {
        mockLeagueRoles({ leagueRoles: [], organizationRole: 'member' });
        mockSeasons([]);
    });

    it('shows the league without the edit form for a plain member', async () => {
        mockSession('member@example.com');
        mockLeague();
        renderRoute('/leagues/1');

        expect(await screen.findByRole('heading', { name: 'Sunday Cup' })).toBeInTheDocument();
        expect(screen.getByText('24 hours')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
    });

    it('saves every field as an owner', async () => {
        mockSession('owner@example.com');
        mockLeagueRoles({ leagueRoles: [], organizationRole: 'owner' });
        mockLeague();
        let saved: unknown;
        server.use(http.put('*/api/leagues/1', async ({ request }) => {
            saved = await request.json();
            return HttpResponse.json(leagueFixture({ name: 'Saturday Cup' }));
        }));
        renderRoute('/leagues/1');

        fireEvent.change(await screen.findByDisplayValue('Sunday Cup'), {
            target: { value: 'Saturday Cup' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

        expect(await screen.findByRole('heading', { name: 'Saturday Cup' })).toBeInTheDocument();
        expect(saved).toEqual({
            banLengthRounds: 2,
            name: 'Saturday Cup',
            rulingSlaHours: 24,
            suspensionThresholdPoints: null,
        });
    });
});
