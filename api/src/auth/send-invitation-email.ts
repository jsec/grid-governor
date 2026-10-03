import type { Resend } from 'resend';

import type { ApiConfig } from '../config/config.js';

export type InvitationSender = (input: OrganizationInvitationEmailInput) => Promise<void>;

export type OrganizationInvitationEmailInput = {
    email: string;
    id: string;
    inviterName: string;
    organizationName: string;
};

export function createResendInvitationSender(
    config: Pick<ApiConfig, 'invitationFromEmail' | 'webUrl'>,
    emails: Pick<Resend['emails'], 'send'>,
): InvitationSender {
    return async (invitation) => {
        const url = new URL(`/invitations/${encodeURIComponent(invitation.id)}`, config.webUrl);

        const result = await emails.send({
            from: config.invitationFromEmail,
            subject: `Invitation to join ${invitation.organizationName}`,
            text: `${invitation.inviterName} invited you to join ${invitation.organizationName}`
                + ' on Grid Governor.'
                + ` Accept the invitation: ${url.href}`,
            to: invitation.email,
        });

        if (result.error) {
            throw new Error('Resend rejected invitation email', { cause: result.error });
        }
    };
}
