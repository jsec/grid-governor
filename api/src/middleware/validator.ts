import type { ZodType } from 'zod';

import { errorBodySchema } from '@grid-governor/core/schemas';
import { validator } from 'hono/validator';

export const validateBody = <T extends ZodType>(schema: T) => validator('json', (body, ctx) => {
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
        const errorBody = errorBodySchema.parse({
            error: 'Invalid request',
            issues: parsed.error.issues,
        });

        return ctx.json(errorBody, 400);
    }

    return parsed.data;
});
