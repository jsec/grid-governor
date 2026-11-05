import { Alert, Button, Container, Group, Stack, Table, Text, Title } from '@mantine/core';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router';
import { HTTPError } from 'ky';
import { useState } from 'react';

import type { RoundFormValues } from '../../../components/round-form';

import { AnchorLink } from '../../../components/anchor-link';
import { RoundForm } from '../../../components/round-form';
import { api } from '../../../lib/api';
import { hasLeaguePermission } from '../../../lib/league-permission';
import { formatRoundStart } from '../../../lib/round-start';
import { leagueRolesQuery } from '../../../queries/leagues';
import { roundListQuery } from '../../../queries/rounds';
import { seasonQuery } from '../../../queries/seasons';

export const Route = createFileRoute('/_authenticated/seasons/$seasonId_/rounds/$roundId')({
    component: RoundRoute,
    loader: async ({ context: { queryClient }, params: { roundId, seasonId } }) => {
        const [season, roundList] = await Promise.all([
            queryClient.ensureQueryData(seasonQuery(seasonId)),
            queryClient.ensureQueryData(roundListQuery(seasonId)),
        ]);

        const isSeasonRound = roundList.rounds.some(round => round.id === roundId);

        if (!isSeasonRound) {
            throw notFound();
        }

        await queryClient.ensureQueryData(leagueRolesQuery(season.leagueId));
    },
});

function RoundRoute() {
    const { roundId, seasonId } = Route.useParams();
    const { data: season } = useSuspenseQuery(seasonQuery(seasonId));
    const { data: { rounds } } = useSuspenseQuery(roundListQuery(seasonId));
    const { data: roles } = useSuspenseQuery(leagueRolesQuery(season.leagueId));
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    const update = useMutation({
        mutationFn: (values: RoundFormValues) =>
            api.put(`rounds/${roundId}`, { json: values }),
        onSuccess: () => queryClient.invalidateQueries({
            queryKey: roundListQuery(seasonId).queryKey,
        }),
    });

    const deletion = useMutation({
        mutationFn: () => api.delete(`rounds/${roundId}`),
        onSuccess: async () => {
            await navigate({ params: { seasonId }, to: '/seasons/$seasonId' });

            return queryClient.invalidateQueries({
                queryKey: roundListQuery(seasonId).queryKey,
            });
        },
    });

    const round = rounds.find(seasonRound => seasonRound.id === roundId);

    if (!round) {
        throw notFound();
    }

    const hasUpdatePermission = hasLeaguePermission(roles, { round: ['update'] });
    const isLastRound = round.id === rounds.at(-1)?.id;
    const isDeleteConflict = deletion.error instanceof HTTPError
        && deletion.error.response.status === 409;
    const deletionErrorMessage = isDeleteConflict
        ? 'This round has results, incidents or bans and can\'t be deleted.'
        : 'The round couldn\'t be deleted.';
    const deletionQuestion = `Delete Round ${round.ordinal} at ${round.track}? It can't be undone.`;

    return (
        <Container py="xl">
            <Stack>
                <AnchorLink params={{ seasonId }} to="/seasons/$seasonId">
                    {season.name}
                </AnchorLink>
                <Title order={1}>{`Round ${round.ordinal}: ${round.track}`}</Title>
                <Table>
                    <Table.Tbody>
                        <Table.Tr>
                            <Table.Th>Track</Table.Th>
                            <Table.Td>{round.track}</Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Th>Starts</Table.Th>
                            <Table.Td>{formatRoundStart(round.startsAt)}</Table.Td>
                        </Table.Tr>
                    </Table.Tbody>
                </Table>
                {hasUpdatePermission && (
                    <Stack>
                        <Title order={2}>Edit round</Title>
                        <RoundForm
                            error={update.error}
                            isPending={update.isPending}
                            onSubmit={values => update.mutate(values)}
                            round={round}
                            submitLabel="Save changes"
                        />
                    </Stack>
                )}
                {hasUpdatePermission && isLastRound && (
                    <Stack align="flex-start">
                        {isConfirmingDelete && (
                            <>
                                <Text>{deletionQuestion}</Text>
                                <Group>
                                    <Button
                                        color="red"
                                        loading={deletion.isPending}
                                        onClick={() => deletion.mutate()}
                                    >
                                        Delete
                                    </Button>
                                    <Button
                                        onClick={() => setIsConfirmingDelete(false)}
                                        variant="default"
                                    >
                                        Cancel
                                    </Button>
                                </Group>
                            </>
                        )}
                        {!isConfirmingDelete && (
                            <Button
                                color="red"
                                onClick={() => setIsConfirmingDelete(true)}
                                variant="outline"
                            >
                                Delete round
                            </Button>
                        )}
                        {deletion.error && (
                            <Alert color="red" role="alert">{deletionErrorMessage}</Alert>
                        )}
                    </Stack>
                )}
            </Stack>
        </Container>
    );
}
