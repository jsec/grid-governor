import { fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import {
    leagueFixture,
    mockLeagueRoles,
    mockRounds,
    mockSession,
    roundFixture,
    seasonFixture,
    server,
} from './msw';
import { renderRoute } from './render-route';

const seasonPath = '/seasons/7';
const firstRoundPath = '/seasons/7/rounds/3';
const roundPath = '/seasons/7/rounds/4';

const twoRounds = [
    roundFixture({ startsAt: '2026-11-08T04:00:00.000Z' }),
    roundFixture({
        id: '4',
        ordinal: 2,
        track: 'Monza',
    }),
];

beforeEach(() => {
    server.use(
        http.get('*/api/leagues/1', () => HttpResponse.json(leagueFixture())),
        http.get('*/api/seasons/7', () => HttpResponse.json(seasonFixture())),
    );
    mockSession('member@example.com');
});

describe('season route rounds', () => {
    describe('round list', () => {
        it('should show each round with its number, track link and start time', async () => {
            mockLeagueRoles({ leagueRoles: [], organizationRole: 'member' });
            mockRounds(twoRounds);
            renderRoute(seasonPath);

            const spaLink = await screen.findByRole('link', { name: 'Spa' });

            expect(spaLink).toHaveAttribute('href', '/seasons/7/rounds/3');
            expect(screen.getByText('Round 1')).toBeInTheDocument();
            expect(screen.getByText(/Nov 8, 2026|8 Nov 2026/)).toBeInTheDocument();
            expect(screen.getByRole('link', { name: 'Monza' }))
                .toHaveAttribute('href', '/seasons/7/rounds/4');
            expect(screen.getByText('Date to be confirmed')).toBeInTheDocument();
        });

        it('should say so when the season has no rounds', async () => {
            mockLeagueRoles({ leagueRoles: [], organizationRole: 'member' });
            mockRounds([]);
            renderRoute(seasonPath);

            const emptyMessage = await screen.findByText('No rounds yet.');

            expect(emptyMessage).toBeInTheDocument();
        });
    });

    describe('add form', () => {
        it('should hide the form from a steward', async () => {
            mockLeagueRoles({ leagueRoles: ['steward'], organizationRole: 'member' });
            mockRounds([]);
            renderRoute(seasonPath);

            await screen.findByText('No rounds yet.');

            expect(screen.queryByRole('button', { name: 'Add round' })).not.toBeInTheDocument();
        });

        it('should add a round as a manager and show it in the list', async () => {
            mockLeagueRoles({ leagueRoles: ['manager'], organizationRole: 'member' });
            mockRounds([]);
            let created: unknown;
            server.use(http.post('*/api/seasons/7/rounds', async ({ request }) => {
                created = await request.json();
                mockRounds([roundFixture({ startsAt: '2026-11-08T14:00:00.000Z' })]);

                return HttpResponse.json(roundFixture(), { status: 201 });
            }));
            renderRoute(seasonPath);

            const track = await screen.findByLabelText(/^Track/);
            fireEvent.change(track, { target: { value: 'Spa' } });
            fireEvent.change(screen.getByLabelText(/^Start time/), {
                target: { value: '2026-11-08T14:00' },
            });
            fireEvent.click(screen.getByRole('button', { name: 'Add round' }));

            const link = await screen.findByRole('link', { name: 'Spa' });

            expect(link).toBeInTheDocument();
            expect(created).toEqual({
                startsAt: '2026-11-08T14:00:00.000Z',
                track: 'Spa',
            });
        });
    });
});

describe('round route', () => {
    it('should show the round without the edit form for a steward', async () => {
        mockLeagueRoles({ leagueRoles: ['steward'], organizationRole: 'member' });
        mockRounds(twoRounds);
        renderRoute(roundPath);

        const heading = await screen.findByRole('heading', { name: 'Round 2: Monza' });

        expect(heading).toBeInTheDocument();
        expect(screen.getByRole('link', { name: '2026' })).toHaveAttribute('href', '/seasons/7');
        expect(screen.getByText('Date to be confirmed')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Delete round' })).not.toBeInTheDocument();
    });

    it('should fill the form and save both fields as a manager', async () => {
        mockLeagueRoles({ leagueRoles: ['manager'], organizationRole: 'member' });
        mockRounds(twoRounds);
        let saved: unknown;
        server.use(http.put('*/api/rounds/3', async ({ request }) => {
            saved = await request.json();
            mockRounds([roundFixture({ track: 'Imola' }), twoRounds[1]]);

            return HttpResponse.json(roundFixture({ track: 'Imola' }));
        }));
        renderRoute(firstRoundPath);

        const startTime = await screen.findByLabelText(/^Start time/);

        expect(startTime).toHaveValue('2026-11-08T04:00');

        fireEvent.change(screen.getByLabelText(/^Track/), { target: { value: 'Imola' } });
        fireEvent.change(startTime, { target: { value: '' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

        const heading = await screen.findByRole('heading', { name: 'Round 1: Imola' });

        expect(heading).toBeInTheDocument();
        expect(saved).toEqual({ startsAt: null, track: 'Imola' });
    });

    it('should offer delete only on the last round', async () => {
        mockLeagueRoles({ leagueRoles: ['manager'], organizationRole: 'member' });
        mockRounds(twoRounds);
        renderRoute(firstRoundPath);

        await screen.findByRole('heading', { name: 'Round 1: Spa' });

        expect(screen.queryByRole('button', { name: 'Delete round' })).not.toBeInTheDocument();
    });

    it('should delete the last round after confirmation and return to the season', async () => {
        mockLeagueRoles({ leagueRoles: ['manager'], organizationRole: 'member' });
        mockRounds(twoRounds);
        server.use(http.delete('*/api/rounds/4', () => {
            mockRounds([twoRounds[0]]);

            return new HttpResponse(null, { status: 204 });
        }));
        const router = renderRoute(roundPath);

        const button = await screen.findByRole('button', { name: 'Delete round' });
        fireEvent.click(button);

        const question = screen.getByText(/Delete Round 2 at Monza\?/);

        expect(question).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

        await waitFor(() => expect(router.state.location.pathname).toBe(seasonPath));

        const spaLink = await screen.findByRole('link', { name: 'Spa' });

        expect(spaLink).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Monza' })).not.toBeInTheDocument();
    });

    it('should explain a 409 when the round has data', async () => {
        mockLeagueRoles({ leagueRoles: [], organizationRole: 'admin' });
        mockRounds(twoRounds);
        server.use(http.delete('*/api/rounds/4', () =>
            HttpResponse.json({ error: 'Conflict' }, { status: 409 })));
        renderRoute(roundPath);

        const button = await screen.findByRole('button', { name: 'Delete round' });
        fireEvent.click(button);
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

        const alert = await screen.findByRole('alert');

        expect(alert).toHaveTextContent(/results, incidents or bans/);
    });

    it('should show the not-found view for an unknown round', async () => {
        mockRounds(twoRounds);
        renderRoute('/seasons/7/rounds/99');

        const heading = await screen.findByRole('heading', { name: 'Not found' });

        expect(heading).toBeInTheDocument();
    });
});
