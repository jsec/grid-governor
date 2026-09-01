import { Hono } from 'hono';

export const app = new Hono();

// eslint-disable-next-line unicorn/no-top-level-side-effects
app.get('/api/health', context => context.json({ status: 'ok' }));
