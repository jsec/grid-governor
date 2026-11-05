import { seasonSchema } from '@grid-governor/core/schemas';
import { Container, Stack, Table, Text, Title } from '@mantine/core';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import type { RoundFormValues } from '../../../components/round-form';
import type { SeasonFormValues } from '../../../components/season-form';

import { AnchorLink } from '../../../components/anchor-link';
import { RoundForm } from '../../../components/round-form';
import { SeasonForm } from '../../../components/season-form';
import { api } from '../../../lib/api';
import { hasLeaguePermission } from '../../../lib/league-permission';
import { formatRoundStart } from '../../../lib/round-start';
import { leagueQuery, leagueRolesQuery } from '../../../queries/leagues';
import { roundListQuery } from '../../../queries/rounds';
import { seasonListQuery, seasonQuery } from '../../../queries/seasons';

const NEW_ROUND_VALUES = {
    startsAt: null,
    track: '',
} satisfies RoundFormValues;

export const Route = createFileRoute('/_authenticated/seasons/$seasonId')({
    component: SeasonRoute,
    loader: async ({ context: { queryClient }, params: { seasonId } }) => {
        const [season] = await Promise.all([
            queryClient.ensureQueryData(seasonQuery(seasonId)),
            queryClient.ensureQueryData(roundListQuery(seasonId)),
        ]);

        await Promise.all([
            queryClient.ensureQueryData(leagueQuery(season.leagueId)),
            queryClient.ensureQueryData(leagueRolesQuery(season.leagueId)),
        ]);
    },
});

function AddRound({ seasonId }: { seasonId: string }) {
    const queryClient = useQueryClient();

    const creation = useMutation({
        mutationFn: (values: RoundFormValues) =>
            api.post(`seasons/${seasonId}/rounds`, { json: values }),
        onSuccess: () => queryClient.invalidateQueries({
            queryKey: roundListQuery(seasonId).queryKey,
        }),
    });

    return (
        <Stack>
            <Title order={3}>Add a round</Title>
            <RoundForm
                error={creation.error}
                isPending={creation.isPending}
                onSubmit={values => creation.mutate(values)}
                round={NEW_ROUND_VALUES}
                submitLabel="Add round"
            />
        </Stack>
    );
}

function SeasonRoute() {
    const { seasonId } = Route.useParams();
    const { data: season } = useSuspenseQuery(seasonQuery(seasonId));
    const { data: { rounds } } = useSuspenseQuery(roundListQuery(seasonId));
    const { data: league } = useSuspenseQuery(leagueQuery(season.leagueId));
    const { data: roles } = useSuspenseQuery(leagueRolesQuery(season.leagueId));
    const queryClient = useQueryClient();

    const hasUpdatePermission = hasLeaguePermission(roles, { season: ['update'] });
    const hasCreateRoundPermission = hasLeaguePermission(roles, { round: ['create'] });
    const penaltyExpiry = season.expiryRounds === null
        ? 'End of season'
        : `${season.expiryRounds} rounds`;

    const update = useMutation({
        mutationFn: (values: SeasonFormValues) =>
            api.put(`seasons/${seasonId}`, { json: values }).json(seasonSchema),
        onSuccess: (updated) => {
            queryClient.setQueryData(seasonQuery(seasonId).queryKey, updated);

            return queryClient.invalidateQueries({
                queryKey: seasonListQuery(updated.leagueId).queryKey,
            });
        },
    });

    return (
        <Container py="xl">
            <Stack>
                <AnchorLink params={{ leagueId: league.id }} to="/leagues/$leagueId">
                    {league.name}
                </AnchorLink>
                <Title order={1}>{season.name}</Title>
                <Table>
                    <Table.Tbody>
                        <Table.Tr>
                            <Table.Th>Points by finishing position</Table.Th>
                            <Table.Td>{season.pointsScheme.join(', ')}</Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Th>Pole bonus</Table.Th>
                            <Table.Td>{season.poleBonus}</Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Th>Fastest lap bonus</Table.Th>
                            <Table.Td>{season.fastestLapBonus}</Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Th>Dropped rounds</Table.Th>
                            <Table.Td>{season.dropWorst}</Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Th>Penalty points expire</Table.Th>
                            <Table.Td>{penaltyExpiry}</Table.Td>
                        </Table.Tr>
                    </Table.Tbody>
                </Table>
                <Title order={2}>Rounds</Title>
                {rounds.length === 0 && <Text>No rounds yet.</Text>}
                {rounds.length > 0 && (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Round</Table.Th>
                                <Table.Th>Track</Table.Th>
                                <Table.Th>Starts</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {rounds.map(round => (
                                <Table.Tr key={round.id}>
                                    <Table.Td>{`Round ${round.ordinal}`}</Table.Td>
                                    <Table.Td>
                                        <AnchorLink
                                            params={{ roundId: round.id, seasonId }}
                                            to="/seasons/$seasonId/rounds/$roundId"
                                        >
                                            {round.track}
                                        </AnchorLink>
                                    </Table.Td>
                                    <Table.Td>{formatRoundStart(round.startsAt)}</Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                )}
                {hasCreateRoundPermission && <AddRound key={rounds.length} seasonId={seasonId} />}
                {hasUpdatePermission && (
                    <Stack>
                        <Title order={2}>Edit season</Title>
                        <SeasonForm
                            error={update.error}
                            isPending={update.isPending}
                            isScoringLocked={season.hasResults}
                            onSubmit={values => update.mutate(values)}
                            season={season}
                            submitLabel="Save changes"
                        />
                    </Stack>
                )}
            </Stack>
        </Container>
    );
}
