import { leagueSchema } from '@grid-governor/core/schemas';
import { Container, List, Stack, Table, Text, Title } from '@mantine/core';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import type { LeagueFormValues } from '../../../components/league-form';
import type { SeasonFormValues } from '../../../components/season-form';

import { authClient } from '../../../auth-client';
import { AnchorLink } from '../../../components/anchor-link';
import { LeagueForm } from '../../../components/league-form';
import { SeasonForm } from '../../../components/season-form';
import { api } from '../../../lib/api';
import { hasSeasonPermission } from '../../../lib/season-permission';
import { leagueListQuery, leagueQuery, leagueRolesQuery } from '../../../queries/leagues';
import { seasonListQuery } from '../../../queries/seasons';

const FIRST_SEASON_VALUES = {
    dropWorst: 0,
    expiryRounds: null,
    fastestLapBonus: 0,
    name: '',
    pointsScheme: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
    poleBonus: 0,
} satisfies SeasonFormValues;

export const Route = createFileRoute('/_authenticated/leagues/$leagueId')({
    component: LeagueRoute,
    loader: async ({ context: { queryClient }, params: { leagueId } }) => {
        await Promise.all([
            queryClient.ensureQueryData(leagueQuery(leagueId)),
            queryClient.ensureQueryData(leagueRolesQuery(leagueId)),
            queryClient.ensureQueryData(seasonListQuery(leagueId)),
        ]);
    },
});

function CreateSeason({ latestSeason, leagueId }: {
    latestSeason?: SeasonFormValues;
    leagueId: string;
}) {
    const queryClient = useQueryClient();

    const creation = useMutation({
        mutationFn: (values: SeasonFormValues) =>
            api.post(`leagues/${leagueId}/seasons`, { json: values }),
        onSuccess: () => queryClient.invalidateQueries({
            queryKey: seasonListQuery(leagueId).queryKey,
        }),
    });

    const startingValues = { ...(latestSeason ?? FIRST_SEASON_VALUES), name: '' };

    return (
        <Stack>
            <Title order={2}>Create a season</Title>
            <SeasonForm
                error={creation.error}
                isPending={creation.isPending}
                isScoringLocked={false}
                onSubmit={values => creation.mutate(values)}
                season={startingValues}
                submitLabel="Create season"
            />
        </Stack>
    );
}

function LeagueRoute() {
    const { leagueId } = Route.useParams();
    const { data: league } = useSuspenseQuery(leagueQuery(leagueId));
    const { data: roles } = useSuspenseQuery(leagueRolesQuery(leagueId));
    const { data: { seasons } } = useSuspenseQuery(seasonListQuery(leagueId));
    const queryClient = useQueryClient();

    const hasUpdatePermission = authClient.organization.checkRolePermission({
        permissions: { league: ['update'] },
        role: roles.organizationRole,
    });
    const hasCreateSeasonPermission = hasSeasonPermission(roles, 'create');
    const [latestSeason] = seasons;

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
                <AnchorLink params={{ leagueId }} to="/leagues/$leagueId/staff">Staff</AnchorLink>
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
                <Title order={2}>Seasons</Title>
                {seasons.length === 0 && <Text>No seasons yet.</Text>}
                <List>
                    {seasons.map(season => (
                        <List.Item key={season.id}>
                            <AnchorLink params={{ seasonId: season.id }} to="/seasons/$seasonId">
                                {season.name}
                            </AnchorLink>
                        </List.Item>
                    ))}
                </List>
                {hasCreateSeasonPermission && (
                    <CreateSeason
                        key={latestSeason?.id}
                        latestSeason={latestSeason}
                        leagueId={leagueId}
                    />
                )}
                {hasUpdatePermission && (
                    <Stack>
                        <Title order={2}>Edit league</Title>
                        <LeagueForm
                            error={update.error}
                            isPending={update.isPending}
                            league={league}
                            onSubmit={values => update.mutate(values)}
                            submitLabel="Save changes"
                        />
                    </Stack>
                )}
            </Stack>
        </Container>
    );
}
