import { describe, expect, it } from 'vitest';

import { createTestApp } from '../test/helpers.ts';

describe('GET /api/health', () => {
    it('returns an OK status document', async () => {
        const { app, lines } = createTestApp(404);
        const response = await app.request('/api/health');

        expect(response.status).toBe(200);

        const body = await response.json();

        expect(lines).toEqual([]);
        expect(body).toEqual({ status: 'ok' });
    });
});

describe('request logging', () => {
    it('writes a single line per request', async () => {
        const { app, lines } = createTestApp(401);

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
