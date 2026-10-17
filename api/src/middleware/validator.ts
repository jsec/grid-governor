import type { ZodType } from 'zod';

import { validator } from 'hono/validator';

export const validateBody = <T extends ZodType>(schema: T) => validator('json', (body, ctx) => {
    const result = schema.safeParse(body);

    if (!result.success) {
        const issues = result.error.issues.map(({ message, path }) => ({ message, path }));
        return ctx.json({ error: 'Invalid request', issues }, 400);
    }

    return result.data;
});
