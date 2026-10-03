import type { AuthHandler } from '@grid-governor/core/auth';
import type { DB } from '@grid-governor/core/db/types';
import type { Kysely } from 'kysely';

import { z } from 'zod';

import type {
    InvitationSender,
    OrganizationInvitationEmailInput,
} from './send-invitation-email.js';

const invitationSchema = z.object({
    email: z.email(),
    id: z.string(),
    inviterId: z.string(),
    organizationId: z.string(),
});

const invitePath = '/api/auth/organization/invite-member';

export const createInviteHandler = (
    authHandler: AuthHandler,
    db: Kysely<DB>,
    sendInvitation: InvitationSender,
): AuthHandler => async (request) => {
    const url = new URL(request.url);

    if (request.method !== 'POST' || url.pathname !== invitePath) {
        return authHandler(request);
    }

    const response = await authHandler(request);
    if (!response.ok) {
        return response;
    }

    let email: OrganizationInvitationEmailInput;

    try {
        const invitation = invitationSchema.parse(await response.clone().json());

        const [organization, inviter] = await Promise.all([
            db.selectFrom('organization')
                .select('name')
                .where('id', '=', invitation.organizationId)
                .executeTakeFirstOrThrow(),
            db.selectFrom('user')
                .select('name')
                .where('id', '=', invitation.inviterId)
                .executeTakeFirstOrThrow(),
        ]);

        email = {
            email: invitation.email,
            id: invitation.id,
            inviterName: inviter.name,
            organizationName: organization.name,
        };
    } catch (error) {
        const errorName = error instanceof Error ? error.name : 'unknown';
        console.error('Invitation processing failed', errorName);

        return Response.json(
            { error: 'Unable to process invitation' },
            { status: 500 },
        );
    }

    try {
        await sendInvitation(email);
    } catch (error) {
        const errorName = error instanceof Error ? error.name : 'unknown';
        console.error('Invitation email delivery failed', errorName);

        return Response.json(
            { error: 'Invitation email delivery failed' },
            { status: 502 },
        );
    }

    return response;
};
