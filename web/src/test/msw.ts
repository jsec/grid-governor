import { setupServer } from 'msw/node';

/*
 * Request handlers are added per test suite. The generated client is mocked
 * here so component tests need no backend.
 */
export const server = setupServer();
