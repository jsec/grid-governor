import type { FormEvent } from 'react';
import type { z } from 'zod';

import {
    errorBodySchema,
    grantLeagueRoleSchema,
    type leagueRoleSchema,
} from '@grid-governor/core/schemas';
import {
    Alert,
    Button,
    Container,
    Group,
    NativeSelect,
    Stack,
    Table,
    Text,
    Title,
} from '@mantine/core';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { HTTPError } from 'ky';

import { authClient } from '../../../auth-client';
import { AnchorLink } from '../../../components/anchor-link';
import { api } from '../../../lib/api';
import {
    leagueMembershipListQuery,
    leagueQuery,
    leagueRolesQuery,
} from '../../../queries/leagues';
import { memberListQuery } from '../../../queries/organizations';

const roleLabels = {
    appeals: 'Appeals',
    manager: 'Manager',
    steward: 'Steward',
} satisfies Record<z.infer<typeof leagueRoleSchema>, string>;

export const Route = createFileRoute('/_authenticated/leagues/$leagueId_/staff')({
    component: LeagueStaffRoute,
    loader: async ({ context: { queryClient }, params: { leagueId } }) => {
        const league = await queryClient.ensureQueryData(leagueQuery(leagueId));

        await Promise.all([
            queryClient.ensureQueryData(leagueMembershipListQuery(leagueId)),
            queryClient.ensureQueryData(leagueRolesQuery(leagueId)),
            queryClient.ensureQueryData(memberListQuery(league.organizationId)),
        ]);
    },
});

function LeagueStaffRoute() {
    const { leagueId } = Route.useParams();
    const { data: league } = useSuspenseQuery(leagueQuery(leagueId));
    const { data: { memberships } } = useSuspenseQuery(leagueMembershipListQuery(leagueId));
    const { data: members } = useSuspenseQuery(memberListQuery(league.organizationId));
    const { data: { organizationRole: role } } = useSuspenseQuery(leagueRolesQuery(leagueId));
    const queryClient = useQueryClient();

    const hasGrantPermission = authClient.organization.checkRolePermission({
        permissions: { leagueRole: ['grant'] },
        role,
    });
    const hasRevokePermission = authClient.organization.checkRolePermission({
        permissions: { leagueRole: ['revoke'] },
        role,
    });

    const names = new Map(members.map(member => [member.userId, member.user.name]));
    const candidates = members.filter(member => member.role === 'member');
    const refreshStaff = () => queryClient.invalidateQueries({
        queryKey: leagueMembershipListQuery(leagueId).queryKey,
    });

    const grant = useMutation({
        mutationFn: (body: z.infer<typeof grantLeagueRoleSchema>) =>
            api.post(`leagues/${leagueId}/memberships`, { json: body }),
        onSuccess: refreshStaff,
    });
    const revoke = useMutation({
        mutationFn: (membershipId: string) => api.delete(`league-memberships/${membershipId}`),
        onSuccess: refreshStaff,
    });

    const grantError = errorBodySchema.safeParse(
        grant.error instanceof HTTPError ? grant.error.data : null,
    );
    const isDuplicate = grant.error instanceof HTTPError && grant.error.response.status === 409;
    const grantMessage = isDuplicate
        ? 'That member already has that role.'
        : grantError.data?.error ?? grant.error?.message;

    const submitGrant = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const entries = Object.fromEntries(new FormData(event.currentTarget));

        grant.mutate(grantLeagueRoleSchema.parse(entries));
    };

    return (
        <Container py="xl">
            <Stack>
                <AnchorLink params={{ leagueId }} to="/leagues/$leagueId">{league.name}</AnchorLink>
                <Title order={1}>Staff</Title>
                {memberships.length === 0 && <Text>No one has a league role yet.</Text>}
                {memberships.length > 0 && (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Name</Table.Th>
                                <Table.Th>Role</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {memberships.map((membership) => {
                                const name = names.get(membership.userId);
                                const roleLabel = roleLabels[membership.role];

                                return (
                                    <Table.Tr key={membership.id}>
                                        <Table.Td>{name}</Table.Td>
                                        <Table.Td>{roleLabel}</Table.Td>
                                        {hasRevokePermission && (
                                            <Table.Td>
                                                <Button
                                                    aria-label={`Revoke ${roleLabel} from ${name}`}
                                                    disabled={revoke.isPending}
                                                    onClick={() => revoke.mutate(membership.id)}
                                                    size="xs"
                                                    variant="subtle"
                                                >
                                                    Revoke
                                                </Button>
                                            </Table.Td>
                                        )}
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                )}
                {revoke.error && (
                    <Alert color="red" role="alert">The role couldn't be revoked.</Alert>
                )}
                {hasGrantPermission && candidates.length === 0 && (
                    <Text>There are no members to give a league role to.</Text>
                )}
                {hasGrantPermission && candidates.length > 0 && (
                    <form onSubmit={submitGrant}>
                        <Stack align="flex-start">
                            <Title order={2}>Grant a role</Title>
                            <Group align="flex-end">
                                <NativeSelect
                                    data={candidates.map(member => ({
                                        label: member.user.name,
                                        value: member.userId,
                                    }))}
                                    label="Member"
                                    name="userId"
                                />
                                <NativeSelect
                                    data={Object.entries(roleLabels).map(([value, label]) => ({
                                        label,
                                        value,
                                    }))}
                                    label="Role"
                                    name="role"
                                />
                                <Button loading={grant.isPending} type="submit">Grant role</Button>
                            </Group>
                            {grant.error && (
                                <Alert color="red" role="alert">{grantMessage}</Alert>
                            )}
                        </Stack>
                    </form>
                )}
            </Stack>
        </Container>
    );
}
