import { leagueSchema } from '@grid-governor/core/schemas';
import { Container, Stack, Table, Title } from '@mantine/core';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import type { LeagueFormValues } from '../../../components/league-form';

import { authClient } from '../../../auth-client';
import { AnchorLink } from '../../../components/anchor-link';
import { LeagueForm } from '../../../components/league-form';
import { api } from '../../../lib/api';
import { leagueListQuery, leagueQuery } from '../../../queries/leagues';
import { memberRoleQuery } from '../../../queries/organizations';

export const Route = createFileRoute('/_authenticated/leagues/$leagueId')({
    component: LeagueRoute,
    loader: async ({ context: { queryClient }, params: { leagueId } }) => {
        const league = await queryClient.ensureQueryData(leagueQuery(leagueId));
        await queryClient.ensureQueryData(memberRoleQuery(league.organizationId));
    },
});

function LeagueRoute() {
    const { leagueId } = Route.useParams();
    const { data: league } = useSuspenseQuery(leagueQuery(leagueId));
    const { data: role } = useSuspenseQuery(memberRoleQuery(league.organizationId));
    const queryClient = useQueryClient();

    const canUpdate = authClient.organization.checkRolePermission({
        permissions: { league: ['update'] },
        role,
    });

    const update = useMutation({
        mutationFn: (values: LeagueFormValues) =>
            api.put(`leagues/${leagueId}`, { json: values }).json(leagueSchema),
        onSuccess: (updated) => {
            queryClient.setQueryData(leagueQuery(leagueId).queryKey, updated);
            return queryClient.invalidateQueries({
                queryKey: leagueListQuery(updated.organizationId).queryKey,
            });
        },
    });

    return (
        <Container py="xl">
            <Stack>
                <AnchorLink
                    params={{ organizationId: league.organizationId }}
                    to="/organizations/$organizationId/leagues"
                >
                    All leagues
                </AnchorLink>
                <Title order={1}>{league.name}</Title>
                <Table>
                    <Table.Tbody>
                        <Table.Tr>
                            <Table.Th>Ruling deadline</Table.Th>
                            <Table.Td>{`${league.rulingSlaHours} hours`}</Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Th>Suspension threshold</Table.Th>
                            <Table.Td>
                                {league.suspensionThresholdPoints ?? 'Organization default'}
                            </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Th>Ban length</Table.Th>
                            <Table.Td>{league.banLengthRounds ?? 'Organization default'}</Table.Td>
                        </Table.Tr>
                    </Table.Tbody>
                </Table>
                {canUpdate && (
                    <Stack>
                        <Title order={2}>Edit league</Title>
                        <LeagueForm
                            error={update.error}
                            league={league}
                            onSubmit={values => update.mutate(values)}
                            pending={update.isPending}
                            submitLabel="Save changes"
                        />
                    </Stack>
                )}
            </Stack>
        </Container>
    );
}
