import type { TestDatabase } from '@grid-governor/core/testing/database';
import type { Resend } from 'resend';

import { createTestDatabase } from '@grid-governor/core/testing/database';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { emailConfig, failingEmails, recordEmails } from '../../test/emails.ts';
import { createTestLogger } from '../../test/helpers.ts';
import { createInviteHandler } from './invite-handler.ts';

const invitation = {
    email: 'member@example.test',
    id: 'invite/1',
    inviterId: 'user-1',
    organizationId: 'org-1',
};

const { logger } = createTestLogger();

function inviteRequest() {
    return new Request('http://localhost/api/auth/organization/invite-member', { method: 'POST' });
}

describe('invitation post-processing', () => {
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
            banLengthRounds: 3,
            id: 'org-1',
            name: 'Club',
            slug: 'club',
            suspensionThresholdPoints: 12,
        })
            .execute();
    });

    afterEach(async () => {
        if (fixture) {
            await fixture.destroy();
        }
    });

    function inviteHandlerReturning(
        authResponse: Record<string, string>,
        emails: Pick<Resend['emails'], 'send'>,
    ) {
        return createInviteHandler(
            async () => Response.json(authResponse),
            fixture.db,
            emails,
            emailConfig,
        );
    }

    it('keeps delivery error details out of responses and logs', async () => {
        const { lines, logger } = createTestLogger();

        const handler = inviteHandlerReturning(
            invitation,
            failingEmails(new Error('Provider failure with private recipient details')),
        );

        const response = await handler(inviteRequest(), logger);
        const body = await response.json();

        expect(response.status).toBe(502);
        expect(body).toEqual({ error: 'Invitation email delivery failed' });

        expect(lines.map(line => JSON.parse(line))).toEqual([
            expect.objectContaining({
                error_name: 'Error',
                level: 'error',
                msg: 'Invitation email delivery failed',
            }),
        ]);
        expect(lines.join('')).not.toContain('private recipient details');
    });

    it('reports a Resend rejection as a delivery failure', async () => {
        const { lines, logger } = createTestLogger();
        const handler = inviteHandlerReturning(invitation, {
            async send() {
                return {
                    data: null,
                    error: {
                        message: 'Sender rejected',
                        name: 'validation_error',
                        statusCode: 422,
                    },
                    headers: null,
                };
            },
        });

        const response = await handler(inviteRequest(), logger);

        expect(response.status).toBe(502);

        expect(lines.map(line => JSON.parse(line))).toEqual([
            expect.objectContaining({
                error_name: 'validation_error',
                level: 'error',
                msg: 'Invitation email delivery failed',
            }),
        ]);
    });

    it('returns 500 without emailing when the organization does not exist', async () => {
        const { emails, sent } = recordEmails();
        const handler = inviteHandlerReturning(
            { ...invitation, organizationId: 'missing' },
            emails,
        );

        const response = await handler(inviteRequest(), logger);

        expect(response.status).toBe(500);
        expect(sent).toEqual([]);
    });

    it('emails an encoded invitation link, then returns the auth response', async () => {
        const { emails, sent } = recordEmails();
        const handler = inviteHandlerReturning(invitation, emails);

        const response = await handler(inviteRequest(), logger);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual(invitation);

        expect(sent).toEqual([{
            from: 'invites@example.test',
            subject: 'Invitation to join Club',
            text: 'Owner invited you to join Club on Grid Governor.'
                + ' Accept the invitation: https://grid.example.test/invitations/invite%2F1',
            to: 'member@example.test',
        }]);
    });

    it('returns 500 without emailing when the database query fails', async () => {
        await fixture.db.schema
            .alterTable('organization')
            .renameTo('unavailable_organization')
            .execute();

        const { emails, sent } = recordEmails();
        const handler = inviteHandlerReturning(invitation, emails);

        const response = await handler(inviteRequest(), logger);
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: 'Unable to process invitation' });
        expect(sent).toEqual([]);
    });

    it('returns 500 without emailing when the auth response is not an invitation', async () => {
        const { emails, sent } = recordEmails();
        const handler = inviteHandlerReturning({ id: 'invite-1' }, emails);

        const response = await handler(inviteRequest(), logger);

        expect(response.status).toBe(500);
        expect(sent).toEqual([]);
    });
});
