import { leagueMembershipSchema } from '@grid-governor/core/schemas';
import { fireEvent, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { leagueFixture, mockMemberRole, mockSession, server } from './msw';
import { renderRoute } from './render-route';

const staffPath = '/leagues/1/staff';

const members = [
    { name: 'Olive Owner', role: 'owner', userId: 'owner' },
    { name: 'Max Member', role: 'member', userId: 'member' },
    { name: 'Dee Driver', role: 'member', userId: 'driver' },
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
            user: { email: `${userId}@example.com`, id: userId, name },
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

    it('lists the staff without grant or revoke controls for a plain member', async () => {
        mockSession('member@example.com');
        mockMemberRole('member');
        mockStaff([membership('10', 'member', 'steward')]);
        renderRoute(staffPath);

        const name = await screen.findByText('Max Member');

        expect(name.closest('tr')).toHaveTextContent('Steward');
        expect(screen.queryByRole('button', { name: /^Revoke/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Grant role' })).not.toBeInTheDocument();
    });

    it('grants a role as an owner and shows it in the list', async () => {
        mockSession('owner@example.com');
        mockMemberRole('owner');
        let granted: unknown;
        server.use(http.post('*/api/leagues/1/memberships', async ({ request }) => {
            granted = await request.json();
            mockStaff([membership('11', 'driver', 'manager')]);
            return HttpResponse.json(membership('11', 'driver', 'manager'), { status: 201 });
        }));
        renderRoute(staffPath);

        fireEvent.change(await screen.findByLabelText('Member'), { target: { value: 'driver' } });
        fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'manager' } });
        fireEvent.click(screen.getByRole('button', { name: 'Grant role' }));

        expect(await screen.findByText('Dee Driver', { selector: 'td' })).toBeInTheDocument();
        expect(granted).toEqual({ role: 'manager', userId: 'driver' });
    });

    it('offers only plain members in the grant form', async () => {
        mockSession('owner@example.com');
        mockMemberRole('owner');
        renderRoute(staffPath);

        const options = within(await screen.findByLabelText('Member')).getAllByRole('option');

        expect(options.map(option => option.textContent)).toEqual(['Max Member', 'Dee Driver']);
    });

    it('says so when the user already holds the role', async () => {
        mockSession('owner@example.com');
        mockMemberRole('owner');
        server.use(http.post('*/api/leagues/1/memberships', () =>
            HttpResponse.json({ error: 'Conflict' }, { status: 409 })));
        renderRoute(staffPath);

        fireEvent.click(await screen.findByRole('button', { name: 'Grant role' }));

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'That member already has that role.',
        );
    });

    it('revokes a role as an admin and removes it from the list', async () => {
        mockSession('admin@example.com');
        mockMemberRole('admin');
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

        expect(await screen.findByText('No one has a league role yet.')).toBeInTheDocument();
        expect(revoked).toBe('10');
    });

    it('says so when there is no one to give a role to', async () => {
        mockSession('owner@example.com');
        mockMemberRole('owner');
        mockMembers([members[0]]);
        renderRoute(staffPath);

        expect(await screen.findByText(/no members to give a league role to/)).toBeInTheDocument();
    });
});
