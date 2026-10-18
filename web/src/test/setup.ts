import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, vi } from 'vitest';

import { server } from './msw';

Object.defineProperty(globalThis, 'matchMedia', {
    value: (query: string) => ({
        addEventListener: vi.fn(),
        matches: false,
        media: query,
        removeEventListener: vi.fn(),
    }),
});

server.listen({ onUnhandledRequest: 'error' });
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
