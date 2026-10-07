import type { AuthHandler } from '@grid-governor/core/auth';

import { createAuth } from '@grid-governor/core/auth';
import { createTestDatabase, type TestDatabase } from '@grid-governor/core/testing/database';
import { hashPassword } from 'better-auth/crypto';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { emailConfig, failingEmails, recordEmails } from '../test/emails.ts';
import { createInviteHandler } from './auth/invite-handler.ts';

const idSchema = z.object({ id: z.string().min(1) });
const organizationBody = {
    banLengthRounds: 3,
    name: 'Grid Club',
    slug: 'grid-club',
    suspensionThresholdPoints: 12,
};

function request(path: string, body: string, cookie?: string) {
    const headers = new Headers({ 'content-type': 'application/json', 'origin': 'http://localhost:3000' });
    if (cookie) {
        headers.set('cookie', cookie);
    }

    return new Request(`http://localhost:3000/api/auth${path}`, {
        body, headers, method: 'POST',
    });
}

describe('Better Auth organization integration', () => {
    let fixture: TestDatabase;
    let handler: AuthHandler;
    let inviteHandler: AuthHandler;
    let password: string;

    beforeAll(async () => {
        password = await hashPassword('test-password-123');
    });

    beforeEach(async () => {
        fixture = await createTestDatabase();
        const { db } = fixture;

        await db.insertInto('user').values([
            { email: 'admin@example.test', id: 'global-admin', name: 'Admin', role: 'admin' },
            { email: 'regular@example.test', id: 'regular-user', name: 'Regular', role: 'user' },
            {
                email: 'other-admin@example.test',
                id: 'other-admin',
                name: 'Other Admin',
                role: 'admin',
            },
        ])
            .execute();
        await db.insertInto('account').values([
            {
                accountId: 'global-admin',
                id: 'account-admin',
                issuer: 'local:credential',
                password,
                providerId: 'credential',
                userId: 'global-admin',
            },
            {
                accountId: 'regular-user',
                id: 'account-regular',
                issuer: 'local:credential',
                password,
                providerId: 'credential',
                userId: 'regular-user',
            },
            {
                accountId: 'other-admin',
                id: 'account-other',
                issuer: 'local:credential',
                password,
                providerId: 'credential',
                userId: 'other-admin',
            },
        ])
            .execute();

        handler = createAuth(db, {
            BETTER_AUTH_SECRET: 'a-secret-long-enough-for-the-integration-test',
            BETTER_AUTH_URL: 'http://localhost:3000',
        }).handler;

        inviteHandler = createInviteHandler(handler, db, recordEmails().emails, emailConfig);
    });

    afterEach(async () => {
        if (fixture) {
            await fixture.destroy();
        }
    });

    async function signIn(email: string): Promise<string> {
        const response = await handler(
            request('/sign-in/email', JSON.stringify({ email, password: 'test-password-123' })),
        );

        expect(response.status).toBe(200);

        const cookie = response.headers.get('set-cookie')?.split(';', 1)[0];

        if (!cookie) {
            throw new Error('Sign-in did not return a session cookie');
        }

        return cookie;
    }

    async function createOrganization() {
        const cookie = await signIn('admin@example.test');

        const response = await handler(
            request('/organization/create', JSON.stringify(organizationBody), cookie),
        );

        expect(response.status).toBe(200);

        const organization = idSchema.parse(await response.json());
        return { cookie, organizationId: organization.id };
    }

    async function createInvitation() {
        const { cookie, organizationId } = await createOrganization();

        const response = await inviteHandler(request('/organization/invite-member', JSON.stringify({
            email: 'regular@example.test',
            organizationId,
            role: 'member',
        }), cookie));

        expect(response.status).toBe(200);

        return { invitationId: idSchema.parse(await response.json()).id, organizationId };
    }

    it('allows an existing account to sign in', async () => {
        await signIn('admin@example.test');
    });

    it('rejects public sign-up', async () => {
        const response = await handler(request('/sign-up/email', JSON.stringify({
            email: 'new@example.test',
            name: 'New',
            password: 'test-password-123',
        })));

        expect(response.ok).toBe(false);

        expect(await fixture.db.selectFrom('user').select('id')
            .where('email', '=', 'new@example.test')
            .execute()).toEqual([]);
    });

    it('rejects unauthenticated creator overrides', async () => {
        const response = await handler(request('/organization/create', JSON.stringify({
            ...organizationBody, userId: 'global-admin',
        })));

        expect(response.status).toBe(401);
    });

    it('rejects organization creation by regular users', async () => {
        const cookie = await signIn('regular@example.test');

        const response = await handler(
            request('/organization/create', JSON.stringify(organizationBody), cookie),
        );

        expect(response.status).toBe(403);
    });

    it('requires organization policy fields', async () => {
        const cookie = await signIn('admin@example.test');

        const response = await handler(
            request('/organization/create', JSON.stringify({ name: 'Club', slug: 'club' }), cookie),
        );

        expect(response.ok).toBe(false);
    });

    it('creates an owner membership for the organization creator', async () => {
        const { organizationId } = await createOrganization();

        const members = await fixture.db
            .selectFrom('member')
            .select(['userId', 'role'])
            .where('organizationId', '=', organizationId)
            .execute();

        expect(members).toEqual([{ role: 'owner', userId: 'global-admin' }]);
    });

    it('rejects duplicate organization slugs', async () => {
        const { cookie } = await createOrganization();

        const response = await handler(
            request('/organization/create', JSON.stringify(organizationBody), cookie),
        );

        expect(response.ok).toBe(false);
    });

    it('disables organization deletion', async () => {
        const { cookie, organizationId } = await createOrganization();

        const response = await handler(
            request('/organization/delete', JSON.stringify({ organizationId }), cookie),
        );

        expect(response.ok).toBe(false);

        expect(await fixture.db.selectFrom('organization').select('id')
            .where('id', '=', organizationId)
            .execute()).toEqual([{ id: organizationId }]);
    });

    it.each([
        '/organization/invite-member/',
        '/organization%2Finvite-member',
        '//organization/invite-member',
    ])(
        'does not wrap alternate invitation path %s', async (path) => {
            const { cookie, organizationId } = await createOrganization();
            const { emails, sent } = recordEmails();
            const alternateHandler = createInviteHandler(handler, fixture.db, emails, emailConfig);

            const response = await alternateHandler(request(path, JSON.stringify({
                email: 'regular@example.test',
                organizationId,
                role: 'member',
            }), cookie));

            expect(response.status).toBe(404);

            expect(await fixture.db.selectFrom('invitation').select('id')
                .where('organizationId', '=', organizationId)
                .execute()).toEqual([]);

            expect(sent).toEqual([]);
        },
    );

    it('requires organization membership even for global admins sending invitations', async () => {
        const { organizationId } = await createOrganization();
        const cookie = await signIn('other-admin@example.test');
        const response = await inviteHandler(request('/organization/invite-member', JSON.stringify({
            email: 'regular@example.test', organizationId, role: 'member',
        }), cookie));
        expect(response.ok).toBe(false);
        expect(await fixture.db.selectFrom('invitation').select('id')
            .where('organizationId', '=', organizationId)
            .execute()).toEqual([]);
    });

    it('keeps a pending invitation after failed delivery and resends it', async () => {
        const { cookie, organizationId } = await createOrganization();
        const body = { email: 'regular@example.test', organizationId, role: 'member' };
        const failingHandler = createInviteHandler(
            handler,
            fixture.db,
            failingEmails(new Error('Provider failed')),
            emailConfig,
        );
        const failed = await failingHandler(
            request('/organization/invite-member', JSON.stringify(body), cookie),
        );
        expect(failed.status).toBe(502);
        const pending = await fixture.db
            .selectFrom('invitation')
            .select(['id', 'status'])
            .where('organizationId', '=', organizationId)
            .executeTakeFirstOrThrow();
        expect(pending.status).toBe('pending');

        const { emails, sent } = recordEmails();
        const resendHandler = createInviteHandler(handler, fixture.db, emails, emailConfig);
        const resendBody = JSON.stringify({ ...body, resend: true });
        const resent = await resendHandler(
            request('/organization/invite-member', resendBody, cookie),
        );
        expect(resent.status).toBe(200);
        expect(sent).toEqual([expect.objectContaining({
            text: expect.stringContaining(`/invitations/${pending.id}`),
        })]);
        expect(idSchema.parse(await resent.json()).id).toBe(pending.id);
    });

    it('returns invitation details to the recipient', async () => {
        const { invitationId } = await createInvitation();
        const cookie = await signIn('regular@example.test');
        const response = await handler(new Request(`http://localhost:3000/api/auth/organization/get-invitation?id=${invitationId}`, { headers: { cookie } }));
        expect(response.status).toBe(200);
        const invitation = z.object({ organizationName: z.string() }).parse(await response.json());
        expect(invitation.organizationName).toBe('Grid Club');
    });

    it('rejects invitation detail requests from other accounts', async () => {
        const { invitationId } = await createInvitation();
        const cookie = await signIn('other-admin@example.test');
        const response = await handler(new Request(`http://localhost:3000/api/auth/organization/get-invitation?id=${invitationId}`, { headers: { cookie } }));
        expect(response.status).toBe(403);
    });

    it('rejects invitation acceptance by other accounts', async () => {
        const { invitationId } = await createInvitation();
        const cookie = await signIn('other-admin@example.test');
        const response = await handler(
            request('/organization/accept-invitation', JSON.stringify({ invitationId }), cookie),
        );
        expect(response.ok).toBe(false);
    });

    it('creates a member when the recipient accepts', async () => {
        const { invitationId, organizationId } = await createInvitation();
        const cookie = await signIn('regular@example.test');
        const response = await handler(
            request('/organization/accept-invitation', JSON.stringify({ invitationId }), cookie),
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

    it('returns the full organization with its members and invitations', async () => {
        const { invitationId, organizationId } = await createInvitation();
        const cookie = await signIn('admin@example.test');
        const response = await handler(new Request(`http://localhost:3000/api/auth/organization/get-full-organization?organizationId=${organizationId}`, { headers: { cookie } }));
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({
            banLengthRounds: 3,
            id: organizationId,
            invitations: [{ email: 'regular@example.test', id: invitationId }],
            members: [{
                role: 'owner', user: { email: 'admin@example.test' }, userId: 'global-admin',
            }],
        });
    });
});
