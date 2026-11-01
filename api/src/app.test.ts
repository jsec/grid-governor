import { createTestDatabase, type TestDatabase } from '@grid-governor/core/testing/database';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, signIn, testPassword } from '../test/helpers.ts';

describe('createApp', () => {
    let fixture: TestDatabase;

    beforeEach(async () => {
        fixture = await createTestDatabase();
    });

    afterEach(async () => {
        await fixture.destroy();
    });

    describe('GET /api/health', () => {
        it('should return an OK status document', async () => {
            const { app, lines } = createTestApp(fixture.db);

            const response = await app.request('/api/health');
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(lines).toEqual([]);
            expect(body).toEqual({ status: 'ok' });
        });
    });

    describe('request logging', () => {
        it('should write a single line per request', async () => {
            const { app, lines } = createTestApp(fixture.db);

            await app.request('/api/auth/get-session');

            const log = JSON.parse(lines[0]);

            expect(lines).toHaveLength(1);
            expect(log).toMatchObject({
                duration_ms: expect.any(Number),
                method: 'GET',
                msg: 'request completed',
                request_id: expect.any(String),
                route: '/api/auth/*',
                status: 200,
            });
        });
    });

    describe('unhandled errors', () => {
        it('should log the stack trace and return a 500', async () => {
            const { app, auth, lines } = createTestApp(fixture.db);

            app.get('/api/failing', () => {
                throw new Error('database error');
            });

            await auth.api.createUser({
                body: {
                    email: 'user@example.test',
                    name: 'User',
                    password: testPassword,
                },
            });

            const cookie = await signIn(auth, 'user@example.test');

            const response = await app.request('/api/failing', { headers: { cookie } });
            const body = await response.json();
            const logs = lines.map(line => JSON.parse(line));

            expect(response.status).toEqual(500);
            expect(body).toEqual({ error: 'Internal error' });
            expect(logs).toMatchObject([
                {
                    err: {
                        message: 'database error',
                        stack: expect.any(String),
                        type: 'Error',
                    },
                    level: 'error',
                    msg: 'Unhandled error',
                    request_id: expect.any(String),
                },
                {
                    msg: 'request completed',
                    status: 500,
                },
            ]);
        });
    });

    describe('sessions', () => {
        it('should reject requests without a session', async () => {
            const { app } = createTestApp(fixture.db);

            const response = await app.request('/api/organizations/1/leagues');
            const body = await response.json();

            expect(response.status).toBe(401);
            expect(body).toEqual({ error: 'Unauthorized' });
        });

        it('should set the signed-in user on the request', async () => {
            const { app, auth } = createTestApp(fixture.db);

            app.get('/api/me', ctx => ctx.json({ email: ctx.var.user.email }));

            await auth.api.createUser({
                body: {
                    email: 'user@example.test',
                    name: 'User',
                    password: testPassword,
                },
            });

            const cookie = await signIn(auth, 'user@example.test');

            const response = await app.request('/api/me', { headers: { cookie } });
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(body).toEqual({ email: 'user@example.test' });
        });
    });

    describe('cross-site requests', () => {
        it('should reject form posts from another origin', async () => {
            const { app } = createTestApp(fixture.db);

            const response = await app.request('/api/organizations/1/leagues', {
                body: 'name=League',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    'origin': 'https://evil.example',
                },
                method: 'POST',
            });
            const body = await response.json();

            expect(response.status).toBe(403);
            expect(body).toEqual({ error: 'Forbidden' });
        });
    });
});
