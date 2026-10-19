import { describe, expect, it } from 'vitest';

import { leagueRoles, roles } from './access.ts';

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

    it.each(['owner', 'admin'] as const)('lets %s grant and revoke league roles', (role) => {
        const result = roles[role].authorize({ leagueRole: ['grant', 'revoke'] });
        expect(result.success).toBe(true);
    });

    it('does not let members grant league roles', () => {
        const result = roles.member.authorize({ leagueRole: ['grant'] });
        expect(result.success).toBe(false);
    });

    it('keeps invitation permissions for admins', () => {
        const result = roles.admin.authorize({ invitation: ['create'] });
        expect(result.success).toBe(true);
    });
});

describe('league roles', () => {
    it.each([
        ['manager', { result: ['update'], round: ['makeOfficial'], season: ['create'] }],
        ['steward', { penalty: ['apply'], result: ['applyRuling'], ruling: ['amend'] }],
        ['appeals', { appeal: ['assign', 'decide'] }],
    ] as const)('lets a %s do their own work', (role, permissions) => {
        const result = leagueRoles[role].authorize(permissions);
        expect(result.success).toBe(true);
    });

    it.each([
        ['manager', { ruling: ['create'] }],
        ['manager', { result: ['applyRuling'] }],
        ['steward', { result: ['update'] }],
        ['steward', { appeal: ['decide'] }],
        ['appeals', { ruling: ['amend'] }],
    ] as const)('does not let a %s do %o', (role, permissions) => {
        const result = leagueRoles[role].authorize(permissions);
        expect(result.success).toBe(false);
    });
});
