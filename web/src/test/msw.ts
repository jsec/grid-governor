import type { z } from 'zod';

import { leagueSchema } from '@grid-governor/core/schemas';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const server = setupServer();

export function leagueFixture(overrides: Partial<z.infer<typeof leagueSchema>> = {}) {
    return leagueSchema.parse({
        banLengthRounds: null,
        createdAt: '2026-10-01T12:00:00.000Z',
        id: '1',
        name: 'Sunday Cup',
        organizationId: 'org-1',
        rulingSlaHours: 24,
        suspensionThresholdPoints: null,
        ...overrides,
    });
}

export function mockInvitation(email: string, options: { error?: string } = {}) {
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

export function mockMemberRole(role: string) {
    server.use(http.get('*/api/auth/organization/get-active-member-role', () =>
        HttpResponse.json({ role })));
}

export function mockSession(email?: string) {
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
