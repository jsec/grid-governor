import { describe, expect, it } from 'vitest';

import { createTestApp } from '../test/helpers.ts';

describe('GET /api/health', () => {
    it('returns an OK status document', async () => {
        const { app, lines } = createTestApp(async () => new Response(null, { status: 200 }));
        const response = await app.request('/api/health');

        expect(response.status).toBe(200);

        const body = await response.json();

        expect(lines).toEqual([]);
        expect(body).toEqual({ status: 'ok' });
    });
});

describe('request logging', () => {
    it('writes a single line per request', async () => {
        const { app, lines } = createTestApp(async () => new Response(null, { status: 401 }));
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
        const { app, lines } = createTestApp(async () => {
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
