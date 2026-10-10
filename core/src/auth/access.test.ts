import { describe, expect, it } from 'vitest';

import { roles } from './access.ts';

describe('organization roles', () => {
    it.each(['owner', 'admin'] as const)('lets %s create, update, and archive leagues', (role) => {
        const result = roles[role].authorize({ league: ['create', 'update', 'archive'] });
        expect(result.success).toBe(true);
    });

    it.each(
        ['create', 'update', 'archive'] as const,
    )('does not let members %s leagues', (action) => {
        const result = roles.member.authorize({ league: [action] });
        expect(result.success).toBe(false);
    });

    it('keeps invitation permissions for admins', () => {
        const result = roles.admin.authorize({ invitation: ['create'] });
        expect(result.success).toBe(true);
    });
});
