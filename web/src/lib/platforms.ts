import type { Platform } from '@grid-governor/core/schemas';

export const PLATFORM_LABELS = {
    acc: 'ACC',
    iracing: 'iRacing',
    lmu: 'LMU',
} satisfies Record<Platform, string>;
