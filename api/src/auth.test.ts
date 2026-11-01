import type { Auth, AuthHandler } from '@grid-governor/core/auth';
import type { CreateEmailOptions } from 'resend';

import { createTestDatabase, type TestDatabase } from '@grid-governor/core/testing/database';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { AuthRouteHandler } from './auth/invite-handler.ts';

import { emailConfig, failingEmails, recordEmails } from '../test/emails.ts';
import {
    createTestAuth,
    createTestLogger,
    seedUsers,
    signIn,
    testPassword,
} from '../test/helpers.ts';
import { createInviteHandler } from './auth/invite-handler.ts';

const idSchema = z.object({ id: z.string().min(1) });

const { logger } = createTestLogger();

const users = [
    {
        email: 'admin@example.test',
        id: 'global-admin',
        name: 'Admin',
        role: 'admin',
    },
    {
        email: 'regular@example.test',
        id: 'regular-user',
        name: 'Regular',
        role: 'user',
    },
    {
        email: 'other-admin@example.test',
        id: 'other-admin',
        name: 'Other Admin',
        role: 'admin',
    },
];

const organizationBody = {
    banLengthRounds: 3,
    name: 'Grid Club',
    slug: 'grid-club',
    suspensionThresholdPoints: 12,
};

const get = (path: string, cookie: string) => {
    return new Request(`http://localhost:3000/api/auth${path}`, { headers: { cookie } });
};

const post = (path: string, body: Record<string, boolean | number | string>, cookie?: string) => {
    const headers = new Headers({
        'content-type': 'application/json',
        'origin': 'http://localhost:3000',
    });

    if (cookie) {
        headers.set('cookie', cookie);
    }

    return new Request(`http://localhost:3000/api/auth${path}`, {
        body: JSON.stringify(body),
        headers,
        method: 'POST',
    });
};

function regularUserInvitation(organizationId: string) {
    return {
        email: 'regular@example.test',
        organizationId,
        role: 'member',
    };
}

describe('Better Auth organization integration', () => {
    let auth: Auth;
    let fixture: TestDatabase;
    let handler: AuthHandler;
    let inviteHandler: AuthRouteHandler;
    let sent: CreateEmailOptions[];

    beforeEach(async () => {
        fixture = await createTestDatabase();

        await seedUsers(fixture.db, users);

        auth = createTestAuth(fixture.db);
        handler = auth.handler;

        const recorded = recordEmails();
        sent = recorded.sent;

        inviteHandler = createInviteHandler({
            authHandler: handler,
            config: emailConfig,
            db: fixture.db,
            emails: recorded.emails,
        });
    });

    afterEach(async () => {
        await fixture.destroy();
    });

    async function createOrganization() {
        const cookie = await signIn(auth, 'admin@example.test');

        const response = await handler(post('/organization/create', organizationBody, cookie));
        const body = await response.json();

        expect(response.status).toBe(200);

        return {
            cookie,
            organizationId: idSchema.parse(body).id,
        };
    }

    async function createInvitation() {
        const { cookie, organizationId } = await createOrganization();

        const response = await inviteHandler(
            post('/organization/invite-member', regularUserInvitation(organizationId), cookie),
            logger,
        );
        const body = await response.json();

        expect(response.status).toBe(200);

        return {
            invitationId: idSchema.parse(body).id,
            organizationId,
        };
    }

    async function invitationIds(organizationId: string) {
        return fixture.db
            .selectFrom('invitation')
            .select('id')
            .where('organizationId', '=', organizationId)
            .execute();
    }

    it('should sign in an existing account with its password', async () => {
        await signIn(auth, 'admin@example.test');
    });

    it('should reject public sign-up', async () => {
        const response = await handler(post('/sign-up/email', {
            email: 'new@example.test',
            name: 'New',
            password: testPassword,
        }));

        const users = await fixture.db
            .selectFrom('user')
            .select('id')
            .where('email', '=', 'new@example.test')
            .execute();

        expect(response.status).toBe(400);
        expect(users).toEqual([]);
    });

    it('should reject signed-out organization creation that names a creator', async () => {
        const response = await handler(post('/organization/create', {
            ...organizationBody,
            userId: 'global-admin',
        }));

        expect(response.status).toBe(401);
    });

    it('should reject organization creation by regular users', async () => {
        const cookie = await signIn(auth, 'regular@example.test');

        const response = await handler(post('/organization/create', organizationBody, cookie));

        expect(response.status).toBe(403);
    });

    it('should reject organizations without a ban length and suspension threshold', async () => {
        const cookie = await signIn(auth, 'admin@example.test');

        const response = await handler(
            post('/organization/create', { name: 'Club', slug: 'club' }, cookie),
        );

        expect(response.status).toBe(400);
    });

    it('should make the organization creator its owner', async () => {
        const { organizationId } = await createOrganization();

        const members = await fixture.db
            .selectFrom('member')
            .select(['userId', 'role'])
            .where('organizationId', '=', organizationId)
            .execute();

        expect(members).toEqual([{ role: 'owner', userId: 'global-admin' }]);
    });

    it('should reject duplicate organization slugs', async () => {
        const { cookie } = await createOrganization();

        const response = await handler(post('/organization/create', organizationBody, cookie));

        expect(response.status).toBe(400);
    });

    it('should not delete organizations', async () => {
        const { cookie, organizationId } = await createOrganization();

        const response = await handler(post('/organization/delete', { organizationId }, cookie));

        const organizations = await fixture.db
            .selectFrom('organization')
            .select('id')
            .where('id', '=', organizationId)
            .execute();

        expect(response.status).toBe(404);
        expect(organizations).toEqual([{ id: organizationId }]);
    });

    it.each([
        '/organization/invite-member/',
        '/organization%2Finvite-member',
        '//organization/invite-member',
    ])('should return 404 and send no invitation for the alternate path %s', async (path) => {
        const { cookie, organizationId } = await createOrganization();

        const response = await inviteHandler(
            post(path, regularUserInvitation(organizationId), cookie),
            logger,
        );

        const invitations = await invitationIds(organizationId);

        expect(response.status).toBe(404);
        expect(invitations).toEqual([]);
        expect(sent).toEqual([]);
    });

    it('should reject invitations from a global admin who is not a member', async () => {
        const { organizationId } = await createOrganization();
        const cookie = await signIn(auth, 'other-admin@example.test');

        const response = await inviteHandler(
            post('/organization/invite-member', regularUserInvitation(organizationId), cookie),
            logger,
        );

        const invitations = await invitationIds(organizationId);

        expect(response.status).toBe(400);
        expect(invitations).toEqual([]);
    });

    it('should keep a pending invitation after failed delivery and resend it', async () => {
        const { cookie, organizationId } = await createOrganization();
        const failingHandler = createInviteHandler({
            authHandler: handler,
            config: emailConfig,
            db: fixture.db,
            emails: failingEmails(new Error('Provider failed')),
        });

        const failed = await failingHandler(
            post('/organization/invite-member', regularUserInvitation(organizationId), cookie),
            logger,
        );

        expect(failed.status).toBe(502);

        const pending = await fixture.db
            .selectFrom('invitation')
            .select(['id', 'status'])
            .where('organizationId', '=', organizationId)
            .executeTakeFirstOrThrow();

        expect(pending.status).toBe('pending');

        const resent = await inviteHandler(
            post(
                '/organization/invite-member',
                { ...regularUserInvitation(organizationId), resend: true },
                cookie,
            ),
            logger,
        );

        const body = await resent.json();

        expect(resent.status).toBe(200);

        expect(sent).toMatchObject([{
            text: expect.stringContaining(`/invitations/${pending.id}`),
        }]);

        expect(idSchema.parse(body).id).toBe(pending.id);
    });

    it('should return invitation details to the recipient', async () => {
        const { invitationId } = await createInvitation();
        const cookie = await signIn(auth, 'regular@example.test');

        const response = await handler(
            get(`/organization/get-invitation?id=${invitationId}`, cookie),
        );
        const body = await response.json();

        expect(response.status).toBe(200);

        const invitation = z.object({
            organizationName: z.string(),
        }).parse(body);

        expect(invitation.organizationName).toBe('Grid Club');
    });

    it('should reject invitation detail requests from other accounts', async () => {
        const { invitationId } = await createInvitation();
        const cookie = await signIn(auth, 'other-admin@example.test');

        const response = await handler(
            get(`/organization/get-invitation?id=${invitationId}`, cookie),
        );

        expect(response.status).toBe(403);
    });

    it('should reject invitation acceptance by other accounts', async () => {
        const { invitationId } = await createInvitation();
        const cookie = await signIn(auth, 'other-admin@example.test');

        const response = await handler(
            post('/organization/accept-invitation', { invitationId }, cookie),
        );

        expect(response.status).toBe(403);
    });

    it('should create a member when the recipient accepts', async () => {
        const { invitationId, organizationId } = await createInvitation();
        const cookie = await signIn(auth, 'regular@example.test');

        const response = await handler(
            post('/organization/accept-invitation', { invitationId }, cookie),
        );

        expect(response.status).toBe(200);

        const member = await fixture.db
            .selectFrom('member')
            .select('role')
            .where('organizationId', '=', organizationId)
            .where('userId', '=', 'regular-user')
            .executeTakeFirstOrThrow();

        expect(member.role).toBe('member');
    });

    it('should return the full organization with its members and invitations', async () => {
        const { invitationId, organizationId } = await createInvitation();
        const cookie = await signIn(auth, 'admin@example.test');

        const response = await handler(
            get(`/organization/get-full-organization?organizationId=${organizationId}`, cookie),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toMatchObject({
            banLengthRounds: 3,
            id: organizationId,
            invitations: [{
                email: 'regular@example.test',
                id: invitationId,
            }],
            members: [{
                role: 'owner',
                user: { email: 'admin@example.test' },
                userId: 'global-admin',
            }],
        });
    });
});
