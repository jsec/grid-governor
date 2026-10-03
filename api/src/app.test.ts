import { describe, expect, it } from 'vitest';

import { createApp } from './app.ts';

describe('GET /api/health', () => {
    it('returns an OK status document', async () => {
        const app = createApp(async () => new Response(null, { status: 404 }));
        const response = await app.request('/api/health');

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({ status: 'ok' });
    });
});
