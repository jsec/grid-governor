import type { AuthHandler } from '@grid-governor/core/auth';
import type { DB } from '@grid-governor/core/db/types';
import type { Logger } from '@grid-governor/core/logging';
import type { Kysely } from 'kysely';
import type { CreateEmailOptions, Resend } from 'resend';

import { z } from 'zod';

import type { ApiConfig } from '../config/config.ts';

const invitationSchema = z.object({
    email: z.email(),
    id: z.string(),
    inviterId: z.string(),
    organizationId: z.string(),
});

const invitePath = '/api/auth/organization/invite-member';

export type AuthRouteHandler = (request: Request, logger: Logger) => Promise<Response>;

export const createInviteHandler = (
    authHandler: AuthHandler,
    db: Kysely<DB>,
    emails: Pick<Resend['emails'], 'send'>,
    config: Pick<ApiConfig, 'INVITATION_FROM_EMAIL' | 'WEB_URL'>,
): AuthRouteHandler => async (request, logger) => {
    const url = new URL(request.url);

    if (request.method !== 'POST' || url.pathname !== invitePath) {
        return authHandler(request);
    }

    const response = await authHandler(request);
    if (!response.ok) {
        return response;
    }

    let email: CreateEmailOptions;

    try {
        const invitation = invitationSchema.parse(await response.clone().json());

        const { inviterName, organizationName } = await db
            .selectFrom(['organization', 'user'])
            .select(['organization.name as organizationName', 'user.name as inviterName'])
            .where('organization.id', '=', invitation.organizationId)
            .where('user.id', '=', invitation.inviterId)
            .executeTakeFirstOrThrow();

        const acceptUrl = new URL(
            `/invitations/${encodeURIComponent(invitation.id)}`,
            config.WEB_URL,
        );

        email = {
            from: config.INVITATION_FROM_EMAIL,
            subject: `Invitation to join ${organizationName}`,
            text: `${inviterName} invited you to join ${organizationName} on Grid Governor.`
                + ` Accept the invitation: ${acceptUrl.href}`,
            to: invitation.email,
        };
    } catch (error) {
        const errorName = error instanceof Error ? error.name : 'unknown';
        logger.error({ error_name: errorName }, 'Invitation processing failed');

        return Response.json(
            { error: 'Unable to process invitation' },
            { status: 500 },
        );
    }

    try {
        const { error } = await emails.send(email);

        if (error) {
            return deliveryFailed(error.name, logger);
        }
    } catch (error) {
        return deliveryFailed(error instanceof Error ? error.name : 'unknown', logger);
    }

    return response;
};

function deliveryFailed(errorName: string, logger: Logger) {
    logger.error({ error_name: errorName }, 'Invitation email delivery failed');

    return Response.json(
        { error: 'Invitation email delivery failed' },
        { status: 502 },
    );
}
