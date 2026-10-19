import { createAccessControl } from 'better-auth/plugins/access';
import {
    adminAc,
    defaultStatements,
    memberAc,
    ownerAc,
} from 'better-auth/plugins/organization/access';

export const accessControl = createAccessControl({
    ...defaultStatements,
    league: ['create', 'update', 'archive'],
    leagueRole: ['grant', 'revoke'],
});

export const roles = {
    admin: accessControl.newRole({
        ...adminAc.statements,
        league: ['create', 'update', 'archive'],
        leagueRole: ['grant', 'revoke'],
    }),
    member: accessControl.newRole({
        ...memberAc.statements,
        league: [],
    }),
    owner: accessControl.newRole({
        ...ownerAc.statements,
        league: ['create', 'update', 'archive'],
        leagueRole: ['grant', 'revoke'],
    }),
};

export const leagueAccessControl = createAccessControl({
    appeal: ['assign', 'decide'],
    driverClaim: ['approve'],
    entry: ['create', 'delete'],
    penalty: ['apply'],
    result: ['update', 'applyRuling'],
    round: ['create', 'update', 'makeOfficial'],
    ruling: ['create', 'amend'],
    season: ['create', 'update'],
});

export const leagueRoles = {
    appeals: leagueAccessControl.newRole({
        appeal: ['assign', 'decide'],
    }),
    manager: leagueAccessControl.newRole({
        driverClaim: ['approve'],
        entry: ['create', 'delete'],
        result: ['update'],
        round: ['create', 'update', 'makeOfficial'],
        season: ['create', 'update'],
    }),
    steward: leagueAccessControl.newRole({
        penalty: ['apply'],
        result: ['applyRuling'],
        ruling: ['create', 'amend'],
    }),
};
