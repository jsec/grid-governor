import type { TestDatabase } from '@grid-governor/core/testing/database';

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

const request = () => new Request('http://localhost/api/auth/organization/invite-member', { method: 'POST' });

const { logger } = createTestLogger();

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

    it('keeps delivery error details out of responses and logs', async () => {
        const { lines, logger } = createTestLogger();

        const handler = createInviteHandler(
            async () => Response.json(invitation),
            fixture.db,
            failingEmails(new Error('Provider failure with private recipient details')),
            emailConfig,
        );

        const response = await handler(request(), logger);
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
    });

    it('reports Resend rejections as delivery failures', async () => {
        const { lines, logger } = createTestLogger();

        const handler = createInviteHandler(
            async () => Response.json(invitation),
            fixture.db,
            {
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
            },
            emailConfig,
        );

        const response = await handler(request(), logger);

        expect(response.status).toBe(502);
        expect(lines.map(line => JSON.parse(line))).toEqual([
            expect.objectContaining({
                error_name: 'validation_error',
                level: 'error',
                msg: 'Invitation email delivery failed',
            }),
        ]);
    });

    it('reports missing invitation context as a failure', async () => {
        const { emails, sent } = recordEmails();
        const handler = createInviteHandler(
            async () => Response.json({ ...invitation, organizationId: 'missing' }),
            fixture.db,
            emails,
            emailConfig,
        );

        const response = await handler(request(), logger);
        expect(response.status).toBe(500);
        expect(sent).toEqual([]);
    });

    it('emails an encoded invitation link, then returns the auth response', async () => {
        const { emails, sent } = recordEmails();
        const handler = createInviteHandler(
            async () => Response.json(invitation),
            fixture.db,
            emails,
            emailConfig,
        );

        const response = await handler(request(), logger);
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

    it('reports database failures as processing failures', async () => {
        await fixture.db.schema
            .alterTable('organization')
            .renameTo('unavailable_organization')
            .execute();

        const { emails, sent } = recordEmails();
        const handler = createInviteHandler(
            async () => Response.json(invitation),
            fixture.db,
            emails,
            emailConfig,
        );

        const response = await handler(request(), logger);
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: 'Unable to process invitation' });
        expect(sent).toEqual([]);
    });

    it('reports invalid auth responses as processing failures', async () => {
        const { emails, sent } = recordEmails();
        const handler = createInviteHandler(
            async () => Response.json({ id: 'invite-1' }),
            fixture.db,
            emails,
            emailConfig,
        );

        const response = await handler(request(), logger);
        expect(response.status).toBe(500);
        expect(sent).toEqual([]);
    });
});
