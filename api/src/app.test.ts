import { createTestDatabase, type TestDatabase } from '@grid-governor/core/testing/database';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, signIn, testPassword } from '../test/helpers.ts';

const notFound = async () => new Response(null, { status: 404 });

describe('createApp', () => {
    let fixture: TestDatabase;

    beforeEach(async () => {
        fixture = await createTestDatabase();
    });

    afterEach(async () => {
        await fixture.destroy();
    });

    describe('GET /api/health', () => {
        it('returns an OK status document', async () => {
            const { app, lines } = createTestApp(fixture.db, notFound);

            const response = await app.request('/api/health');
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(lines).toEqual([]);
            expect(body).toEqual({ status: 'ok' });
        });
    });

    describe('request logging', () => {
        it('writes a single line per request', async () => {
            const { app, lines } = createTestApp(
                fixture.db,
                async () => new Response(null, { status: 401 }),
            );

            await app.request('/api/auth/get-session');

            const log = JSON.parse(lines[0]);

            expect(lines).toHaveLength(1);
            expect(log).toMatchObject({
                duration_ms: expect.any(Number),
                method: 'GET',
                msg: 'request completed',
                request_id: expect.any(String),
                route: '/api/auth/*',
                status: 401,
            });
        });
    });

    describe('unhandled errors', () => {
        it('logs the stack trace and returns a 500', async () => {
            const { app, lines } = createTestApp(fixture.db, async () => {
                throw new Error('database error');
            });

            const response = await app.request('/api/auth/get-session');
            const body = await response.json();
            const logs = lines.map(line => JSON.parse(line));

            expect(response.status).toEqual(500);
            expect(body).toEqual({ error: 'Internal error' });
            expect(logs).toEqual([
                expect.objectContaining({
                    err: expect.objectContaining({
                        message: 'database error',
                        stack: expect.any(String),
                        type: 'Error',
                    }),
                    level: 'error',
                    msg: 'Unhandled error',
                    request_id: expect.any(String),
                }),
                expect.objectContaining({
                    msg: 'request completed',
                    status: 500,
                }),
            ]);
        });
    });

    describe('sessions', () => {
        it('rejects requests without a session', async () => {
            const { app } = createTestApp(fixture.db, notFound);

            const response = await app.request('/api/organizations/1/leagues');

            expect(response.status).toBe(401);
        });

        it('sets the signed-in user on the request', async () => {
            const { app, auth } = createTestApp(fixture.db, notFound);
            app.get('/api/me', ctx => ctx.json({ email: ctx.var.user.email }));

            await auth.api.createUser({
                body: { email: 'user@example.test', name: 'User', password: testPassword },
            });

            const cookie = await signIn(auth, 'user@example.test');

            const response = await app.request('/api/me', { headers: { cookie } });
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(body).toEqual({ email: 'user@example.test' });
        });
    });

    describe('cross-site requests', () => {
        it('rejects form posts from another origin', async () => {
            const { app } = createTestApp(fixture.db, notFound);

            const response = await app.request('/api/organizations/1/leagues', {
                body: 'name=League',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    'origin': 'https://evil.example',
                },
                method: 'POST',
            });

            expect(response.status).toBe(403);
        });
    });
});
