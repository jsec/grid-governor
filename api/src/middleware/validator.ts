import type { ZodType } from 'zod';

import { errorBodySchema } from '@grid-governor/core/schemas';
import { validator } from 'hono/validator';

export const validateBody = <T extends ZodType>(schema: T) => validator('json', (body, ctx) => {
    const result = schema.safeParse(body);

    if (!result.success) {
        const errorBody = errorBodySchema.parse({
            error: 'Invalid request',
            issues: result.error.issues,
        });

        return ctx.json(errorBody, 400);
    }

    return result.data;
});
