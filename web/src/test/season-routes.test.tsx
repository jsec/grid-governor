import { fireEvent, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import {
    leagueFixture,
    mockLeagueRoles,
    mockRounds,
    mockSeasons,
    mockSession,
    seasonFixture,
    server,
} from './msw';
import { renderRoute } from './render-route';

const leaguePath = '/leagues/1';
const seasonPath = '/seasons/7';

function mockSeason(overrides: Parameters<typeof seasonFixture>[0] = {}) {
    server.use(http.get('*/api/seasons/7', () => HttpResponse.json(seasonFixture(overrides))));
}

beforeEach(() => {
    server.use(http.get('*/api/leagues/1', () => HttpResponse.json(leagueFixture())));
    mockSession('member@example.com');
    mockRounds([]);
});

describe('league route seasons', () => {
    describe('season list', () => {
        it('should link each season to its page', async () => {
            mockLeagueRoles({ leagueRoles: [], organizationRole: 'member' });
            mockSeasons([
                seasonFixture({ id: '8', name: '2027' }),
                seasonFixture({ id: '7', name: '2026' }),
            ]);
            renderRoute(leaguePath);

            const link = await screen.findByRole('link', { name: '2027' });

            expect(link).toHaveAttribute('href', '/seasons/8');
            expect(screen.getByRole('link', { name: '2026' }))
                .toHaveAttribute('href', '/seasons/7');
        });

        it('should say so when the league has no seasons', async () => {
            mockLeagueRoles({ leagueRoles: [], organizationRole: 'member' });
            mockSeasons([]);
            renderRoute(leaguePath);

            const emptyMessage = await screen.findByText('No seasons yet.');

            expect(emptyMessage).toBeInTheDocument();
        });
    });

    describe('create form', () => {
        it('should hide the form from a steward', async () => {
            mockLeagueRoles({ leagueRoles: ['steward'], organizationRole: 'member' });
            mockSeasons([]);
            renderRoute(leaguePath);

            await screen.findByText('No seasons yet.');

            expect(screen.queryByRole('button', { name: 'Create season' })).not.toBeInTheDocument();
        });

        it('should start a first season with the default ladder', async () => {
            mockLeagueRoles({ leagueRoles: [], organizationRole: 'owner' });
            mockSeasons([]);
            renderRoute(leaguePath);

            const firstPosition = await screen.findByLabelText(/^Position 1\b/);

            expect(firstPosition).toHaveValue('25');
            expect(screen.getByLabelText(/^Position 10\b/)).toHaveValue('1');
            expect(screen.queryByLabelText(/^Position 11\b/)).not.toBeInTheDocument();
            expect(screen.getByLabelText(/^Pole bonus/)).toHaveValue('0');
            expect(screen.getByLabelText(/^Penalty points expire/)).toHaveValue('');
        });

        it('should start from the latest season with an empty name', async () => {
            mockLeagueRoles({ leagueRoles: ['manager'], organizationRole: 'member' });
            mockSeasons([seasonFixture({
                expiryRounds: 4,
                pointsScheme: [10, 5],
                poleBonus: 1,
            })]);
            renderRoute(leaguePath);

            const firstPosition = await screen.findByLabelText(/^Position 1\b/);

            expect(firstPosition).toHaveValue('10');
            expect(screen.getByLabelText(/^Position 2\b/)).toHaveValue('5');
            expect(screen.queryByLabelText(/^Position 3\b/)).not.toBeInTheDocument();
            expect(screen.getByLabelText(/^Pole bonus/)).toHaveValue('1');
            expect(screen.getByLabelText(/^Penalty points expire/)).toHaveValue('4');
            expect(screen.getByLabelText(/^Name/)).toHaveValue('');
        });

        it('should create a season as a manager and show it in the list', async () => {
            mockLeagueRoles({ leagueRoles: ['manager'], organizationRole: 'member' });
            mockSeasons([seasonFixture()]);
            let created: unknown;
            server.use(http.post('*/api/leagues/1/seasons', async ({ request }) => {
                created = await request.json();
                mockSeasons([seasonFixture({ id: '8', name: '2027' }), seasonFixture()]);

                return HttpResponse.json(seasonFixture({ id: '8', name: '2027' }), { status: 201 });
            }));
            renderRoute(leaguePath);

            const name = await screen.findByLabelText(/^Name/);
            fireEvent.change(name, { target: { value: '2027' } });
            fireEvent.click(screen.getByRole('button', { name: 'Create season' }));

            const link = await screen.findByRole('link', { name: '2027' });

            expect(link).toBeInTheDocument();
            expect(created).toEqual({
                dropWorst: 0,
                expiryRounds: null,
                fastestLapBonus: 0,
                name: '2027',
                pointsScheme: [25, 18, 15],
                poleBonus: 0,
            });
        });

        it('should say so when the name is taken', async () => {
            mockLeagueRoles({ leagueRoles: ['manager'], organizationRole: 'member' });
            mockSeasons([seasonFixture()]);
            server.use(http.post('*/api/leagues/1/seasons', () =>
                HttpResponse.json({ error: 'Conflict' }, { status: 409 })));
            renderRoute(leaguePath);

            const name = await screen.findByLabelText(/^Name/);
            fireEvent.change(name, { target: { value: '2026' } });
            fireEvent.click(screen.getByRole('button', { name: 'Create season' }));

            const alert = await screen.findByRole('alert');

            expect(alert).toHaveTextContent(/name already exists/);
        });
    });

    describe('points ladder', () => {
        it('should add a position worth 0 points and remove the last one', async () => {
            mockLeagueRoles({ leagueRoles: [], organizationRole: 'owner' });
            mockSeasons([seasonFixture({ pointsScheme: [10] })]);
            renderRoute(leaguePath);

            const button = await screen.findByRole('button', { name: 'Add position' });
            fireEvent.click(button);

            expect(screen.getByLabelText(/^Position 2\b/)).toHaveValue('0');

            fireEvent.click(screen.getByRole('button', { name: 'Remove last position' }));

            expect(screen.queryByLabelText(/^Position 2\b/)).not.toBeInTheDocument();
        });

        it('should keep at least one position', async () => {
            mockLeagueRoles({ leagueRoles: [], organizationRole: 'owner' });
            mockSeasons([seasonFixture({ pointsScheme: [10] })]);
            renderRoute(leaguePath);

            const button = await screen.findByRole('button', { name: 'Remove last position' });

            expect(button).toBeDisabled();
        });
    });
});

describe('season route', () => {
    it('should show the settings without the edit form for a plain member', async () => {
        mockLeagueRoles({ leagueRoles: ['steward'], organizationRole: 'member' });
        mockSeason();
        renderRoute(seasonPath);

        const heading = await screen.findByRole('heading', { name: '2026' });

        expect(heading).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Sunday Cup' }))
            .toHaveAttribute('href', '/leagues/1');
        expect(screen.getByText('25, 18, 15')).toBeInTheDocument();
        expect(screen.getByText('End of season')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
    });

    it('should save every field as a manager', async () => {
        mockLeagueRoles({ leagueRoles: ['manager'], organizationRole: 'member' });
        mockSeason({ expiryRounds: 3 });
        let saved: unknown;
        server.use(http.put('*/api/seasons/7', async ({ request }) => {
            saved = await request.json();

            return HttpResponse.json(seasonFixture({ expiryRounds: 3, name: '2026 Spring' }));
        }));
        renderRoute(seasonPath);

        const name = await screen.findByLabelText(/^Name/);
        fireEvent.change(name, { target: { value: '2026 Spring' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

        const heading = await screen.findByRole('heading', { name: '2026 Spring' });

        expect(heading).toBeInTheDocument();
        expect(saved).toEqual({
            dropWorst: 0,
            expiryRounds: 3,
            fastestLapBonus: 0,
            name: '2026 Spring',
            pointsScheme: [25, 18, 15],
            poleBonus: 0,
        });
    });

    it('should make the scoring read-only when the season has results', async () => {
        mockLeagueRoles({ leagueRoles: [], organizationRole: 'admin' });
        mockSeason({ hasResults: true });
        renderRoute(seasonPath);

        const name = await screen.findByLabelText(/^Name/);

        expect(name).not.toHaveAttribute('readonly');
        expect(screen.getByLabelText(/^Position 1\b/)).toHaveAttribute('readonly');
        expect(screen.getByLabelText(/^Pole bonus/)).toHaveAttribute('readonly');
        expect(screen.getByLabelText(/^Penalty points expire/)).toHaveAttribute('readonly');
        expect(screen.getByRole('button', { name: 'Add position' })).toBeDisabled();
        expect(screen.getByText(/scoring can't change/)).toBeInTheDocument();
    });

    it('should show the not-found view for an unknown season', async () => {
        server.use(http.get('*/api/seasons/7', () =>
            HttpResponse.json({ error: 'Not Found' }, { status: 404 })));
        renderRoute(seasonPath);

        const heading = await screen.findByRole('heading', { name: 'Not found' });

        expect(heading).toBeInTheDocument();
    });
});
