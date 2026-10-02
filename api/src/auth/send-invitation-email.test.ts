import type { CreateEmailOptions } from 'resend';

import { expect, it } from 'vitest';

import { createResendInvitationSender } from './send-invitation-email.js';

const config = {
    invitationFromEmail: 'invites@example.test',
    webUrl: 'https://grid.example.test',
};
const invitation = {
    email: 'member@example.test',
    id: 'invite/1',
    inviterName: 'Owner',
    organizationName: 'Club',
};

it('sends the recipient an encoded invitation link using captured configuration', async () => {
    const sent: CreateEmailOptions[] = [];

    const sender = createResendInvitationSender(config, {
        async send(email) {
            sent.push(email);
            return { data: { id: 'email-1' }, error: null, headers: null };
        },
    });

    await sender(invitation);

    expect(sent).toEqual([{
        from: 'invites@example.test',
        subject: 'Invitation to join Club',
        text: 'Owner invited you to join Club on Grid Governor. Accept the invitation: https://grid.example.test/invitations/invite%2F1',
        to: 'member@example.test',
    }]);
});

it('preserves transport failures for the request handler', async () => {
    const failure = new Error('Transport failed');

    const sender = createResendInvitationSender(config, {
        async send() {
            throw failure;
        },
    });

    await expect(sender(invitation)).rejects.toBe(failure);
});

it('preserves Resend rejection details as the error cause', async () => {
    const rejection = {
        message: 'Sender rejected',
        name: 'validation_error',
        statusCode: 422,
    } as const;

    const sender = createResendInvitationSender(config, {
        async send() {
            return { data: null, error: rejection, headers: null };
        },
    });

    await expect(sender(invitation)).rejects.toHaveProperty('cause', rejection);
});
