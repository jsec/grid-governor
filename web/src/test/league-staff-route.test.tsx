import { leagueMembershipSchema } from '@grid-governor/core/schemas';
import { fireEvent, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { leagueFixture, mockLeagueRoles, mockSession, server } from './msw';
import { renderRoute } from './render-route';

const staffPath = '/leagues/1/staff';

const members = [
    {
        name: 'Olive Owner',
        role: 'owner',
        userId: 'owner',
    },
    {
        name: 'Max Member',
        role: 'member',
        userId: 'member',
    },
    {
        name: 'Dee Driver',
        role: 'member',
        userId: 'driver',
    },
];

function membership(id: string, userId: string, role: string) {
    return leagueMembershipSchema.parse({
        grantedAt: '2026-10-01T12:00:00.000Z',
        id,
        role,
        userId,
    });
}

function mockMembers(list: typeof members) {
    server.use(http.get('*/api/auth/organization/list-members', () => HttpResponse.json({
        members: list.map(({ name, role, userId }) => ({
            createdAt: '2026-10-01T12:00:00.000Z',
            id: `member-${userId}`,
            organizationId: 'org-1',
            role,
            user: {
                email: `${userId}@example.com`,
                id: userId,
                name,
            },
            userId,
        })),
        total: list.length,
    })));
}

function mockStaff(memberships: ReturnType<typeof membership>[]) {
    server.use(http.get('*/api/leagues/1/memberships', () => HttpResponse.json({ memberships })));
}

describe('league staff route', () => {
    beforeEach(() => {
        server.use(http.get('*/api/leagues/1', () => HttpResponse.json(leagueFixture())));
        mockMembers(members);
        mockStaff([]);
    });

    it('should list the staff without grant or revoke controls for a plain member', async () => {
        mockSession('member@example.com');
        mockLeagueRoles({ leagueRoles: [], organizationRole: 'member' });
        mockStaff([membership('10', 'member', 'steward')]);
        renderRoute(staffPath);

        const name = await screen.findByText('Max Member');

        expect(name.closest('tr')).toHaveTextContent('Steward');
        expect(screen.queryByRole('button', { name: /^Revoke/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Grant role' })).not.toBeInTheDocument();
    });

    it('should grant a role as an owner and show it in the list', async () => {
        mockSession('owner@example.com');
        mockLeagueRoles({ leagueRoles: [], organizationRole: 'owner' });
        let granted: unknown;
        server.use(http.post('*/api/leagues/1/memberships', async ({ request }) => {
            granted = await request.json();
            mockStaff([membership('11', 'driver', 'manager')]);

            return HttpResponse.json(membership('11', 'driver', 'manager'), { status: 201 });
        }));
        renderRoute(staffPath);

        const memberField = await screen.findByLabelText('Member');
        fireEvent.change(memberField, { target: { value: 'driver' } });
        fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'manager' } });
        fireEvent.click(screen.getByRole('button', { name: 'Grant role' }));

        const message = await screen.findByText('Dee Driver', { selector: 'td' });

        expect(message).toBeInTheDocument();
        expect(granted).toEqual({ role: 'manager', userId: 'driver' });
    });

    it('should offer only plain members in the grant form', async () => {
        mockSession('owner@example.com');
        mockLeagueRoles({ leagueRoles: [], organizationRole: 'owner' });
        renderRoute(staffPath);

        const memberField = await screen.findByLabelText('Member');
        const options = within(memberField).getAllByRole('option');

        expect(options.map(option => option.textContent)).toEqual(['Max Member', 'Dee Driver']);
    });

    it('should say so when the user already holds the role', async () => {
        mockSession('owner@example.com');
        mockLeagueRoles({ leagueRoles: [], organizationRole: 'owner' });
        server.use(http.post('*/api/leagues/1/memberships', () =>
            HttpResponse.json({ error: 'Conflict' }, { status: 409 })));
        renderRoute(staffPath);

        const grantRoleButton = await screen.findByRole('button', { name: 'Grant role' });
        fireEvent.click(grantRoleButton);

        const alert = await screen.findByRole('alert');

        expect(alert).toHaveTextContent(
            'That member already has that role.',
        );
    });

    it('should revoke a role as an admin and remove it from the list', async () => {
        mockSession('admin@example.com');
        mockLeagueRoles({ leagueRoles: [], organizationRole: 'admin' });
        mockStaff([membership('10', 'member', 'steward')]);
        let revoked = '';
        server.use(http.delete('*/api/league-memberships/:membershipId', ({ params }) => {
            revoked = String(params.membershipId);
            mockStaff([]);

            return new HttpResponse(null, { status: 204 });
        }));
        renderRoute(staffPath);

        const revokeButton = await screen.findByRole('button', {
            name: 'Revoke Steward from Max Member',
        });
        fireEvent.click(revokeButton);

        const message = await screen.findByText('No one has a league role yet.');

        expect(message).toBeInTheDocument();
        expect(revoked).toBe('10');
    });

    it('should say so when there is no one to give a role to', async () => {
        mockSession('owner@example.com');
        mockLeagueRoles({ leagueRoles: [], organizationRole: 'owner' });
        mockMembers([members[0]]);
        renderRoute(staffPath);

        const message = await screen.findByText(/no members to give a league role to/);

        expect(message).toBeInTheDocument();
    });
});
