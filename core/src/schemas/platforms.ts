import { z } from 'zod';

export const platformSchema = z.enum([
    'acc',
    'iracing',
    'lmu',
]);

export type Platform = z.infer<typeof platformSchema>;
