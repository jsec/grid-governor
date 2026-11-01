import { seasonSchema } from '@grid-governor/core/schemas';
import { Container, Stack, Table, Title } from '@mantine/core';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import type { SeasonFormValues } from '../../../components/season-form';

import { AnchorLink } from '../../../components/anchor-link';
import { SeasonForm } from '../../../components/season-form';
import { api } from '../../../lib/api';
import { hasSeasonPermission } from '../../../lib/season-permission';
import { leagueQuery, leagueRolesQuery } from '../../../queries/leagues';
import { seasonListQuery, seasonQuery } from '../../../queries/seasons';

export const Route = createFileRoute('/_authenticated/seasons/$seasonId')({
    component: SeasonRoute,
    loader: async ({ context: { queryClient }, params: { seasonId } }) => {
        const season = await queryClient.ensureQueryData(seasonQuery(seasonId));

        await Promise.all([
            queryClient.ensureQueryData(leagueQuery(season.leagueId)),
            queryClient.ensureQueryData(leagueRolesQuery(season.leagueId)),
        ]);
    },
});

function SeasonRoute() {
    const { seasonId } = Route.useParams();
    const { data: season } = useSuspenseQuery(seasonQuery(seasonId));
    const { data: league } = useSuspenseQuery(leagueQuery(season.leagueId));
    const { data: roles } = useSuspenseQuery(leagueRolesQuery(season.leagueId));
    const queryClient = useQueryClient();

    const canUpdate = hasSeasonPermission(roles, 'update');
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
                {canUpdate && (
                    <Stack>
                        <Title order={2}>Edit season</Title>
                        <SeasonForm
                            error={update.error}
                            isScoringLocked={season.hasResults}
                            onSubmit={values => update.mutate(values)}
                            pending={update.isPending}
                            season={season}
                            submitLabel="Save changes"
                        />
                    </Stack>
                )}
            </Stack>
        </Container>
    );
}
