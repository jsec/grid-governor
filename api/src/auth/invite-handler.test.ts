import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import type { TestDatabase } from '../../test/database.js';

import { createTestDatabase, dbTests } from '../../test/database.js';
import { createInviteHandler } from './invite-handler.js';

const invitation = {
    email: 'member@example.test',
    id: 'invite-1',
    inviterId: 'user-1',
    organizationId: 'org-1',
};

const request = () => new Request('http://localhost/api/auth/organization/invite-member', { method: 'POST' });

dbTests('invitation post-processing', () => {
    let fixture: TestDatabase;

    beforeEach(async () => {
        fixture = await createTestDatabase();

        await fixture.db.insertInto('user').values({
            email: 'owner@example.test',
            id: 'user-1',
            name: 'Owner',
        })
            .execute();

        await fixture.db.insertInto('organization').values({
            ban_length_rounds: 3,
            id: 'org-1',
            name: 'Club',
            slug: 'club',
            suspension_threshold_points: 12,
        })
            .execute();
    });

    afterEach(async () => {
        vi.restoreAllMocks();

        if (fixture) {
            await fixture.destroy();
        }
    });

    it('keeps delivery error details out of responses and logs', async () => {
        const log = vi.spyOn(console, 'error');

        const handler = createInviteHandler(
            async () => Response.json(invitation),
            fixture.db,
            async () => {
                throw new Error('Provider failure with private recipient details');
            },
        );

        const response = await handler(request());
        const body = await response.json();

        expect(response.status).toBe(502);
        expect(body).toEqual({ error: 'Invitation email delivery failed' });
        expect(log).toHaveBeenCalledWith('Invitation email delivery failed', 'Error');
    });

    it('reports missing invitation context as a failure', async () => {
        const handler = createInviteHandler(
            async () => Response.json({ ...invitation, organizationId: 'missing' }),
            fixture.db,
            async () => { throw new Error('Sender must not run'); },
        );

        const response = await handler(request());
        expect(response.status).toBe(500);
    });

    it('returns successful auth responses after sending their invitation', async () => {
        const sent: string[] = [];

        const handler = createInviteHandler(
            async () => Response.json(invitation),
            fixture.db,
            async (email) => {
                sent.push(email.id);
                expect(email.inviterName).toBe('Owner');
                expect(email.organizationName).toBe('Club');
            },
        );

        const response = await handler(request());
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual(invitation);
        expect(sent).toEqual(['invite-1']);
    });

    it('reports database failures as processing failures', async () => {
        await fixture.db.schema
            .alterTable('organization')
            .renameTo('unavailable_organization')
            .execute();

        const handler = createInviteHandler(
            async () => Response.json(invitation),
            fixture.db,
            async () => {
                throw new Error('Sender must not run');
            },
        );

        const response = await handler(request());
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: 'Unable to process invitation' });
    });

    it('reports invalid auth responses as processing failures', async () => {
        const handler = createInviteHandler(
            async () => Response.json({ id: 'invite-1' }),
            fixture.db,
            async () => {
                throw new Error('Sender must not run');
            },
        );

        const response = await handler(request());
        expect(response.status).toBe(500);
    });
});
