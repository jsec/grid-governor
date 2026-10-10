import { createAccessControl } from 'better-auth/plugins/access';
import {
    adminAc,
    defaultStatements,
    memberAc,
    ownerAc,
} from 'better-auth/plugins/organization/access';

export const accessControl = createAccessControl({
    ...defaultStatements,
    league: [
        'create',
        'update',
        'archive',
    ],
});

export const roles = {
    admin: accessControl.newRole({
        ...adminAc.statements,
        league: ['create', 'update', 'archive'],
    }),
    member: accessControl.newRole({
        ...memberAc.statements,
        league: [],
    }),
    owner: accessControl.newRole({
        ...ownerAc.statements,
        league: ['create', 'update', 'archive'],
    }),
};
