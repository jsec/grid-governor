import { leagueSchema } from '@grid-governor/core/schemas';
import { Container, List, Stack, Text, Title } from '@mantine/core';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import type { LeagueFormValues } from '../../../../components/league-form';

import { authClient } from '../../../../auth-client';
import { AnchorLink } from '../../../../components/anchor-link';
import { LeagueForm } from '../../../../components/league-form';
import { api } from '../../../../lib/api';
import { leagueListQuery } from '../../../../queries/leagues';
import { memberRoleQuery } from '../../../../queries/organizations';

export const Route = createFileRoute('/_authenticated/organizations/$organizationId/leagues')({
    component: LeaguesRoute,
    loader: async ({ context: { queryClient }, params: { organizationId } }) => {
        await queryClient.ensureQueryData(leagueListQuery(organizationId));
        await queryClient.ensureQueryData(memberRoleQuery(organizationId));
    },
});

function CreateLeague({ organizationId }: { organizationId: string }) {
    const queryClient = useQueryClient();
    const creation = useMutation({
        mutationFn: (values: LeagueFormValues) =>
            api.post(`organizations/${organizationId}/leagues`, { json: values })
                .json(leagueSchema),
        onSuccess: () => queryClient.invalidateQueries({
            queryKey: leagueListQuery(organizationId).queryKey,
        }),
    });

    return (
        <Stack>
            <Title order={2}>Create a league</Title>
            <LeagueForm
                error={creation.error}
                onSubmit={(values, form) => {
                    creation.mutate(values, { onSuccess: () => form.reset() });
                }}
                pending={creation.isPending}
                submitLabel="Create league"
            />
        </Stack>
    );
}

function LeaguesRoute() {
    const { organizationId } = Route.useParams();
    const { data: { leagues } } = useSuspenseQuery(leagueListQuery(organizationId));
    const { data: role } = useSuspenseQuery(memberRoleQuery(organizationId));

    const canCreate = authClient.organization.checkRolePermission({
        permissions: { league: ['create'] },
        role,
    });

    return (
        <Container py="xl">
            <Stack>
                <Title order={1}>Leagues</Title>
                {leagues.length === 0 && <Text>No leagues yet.</Text>}
                <List>
                    {leagues.map(league => (
                        <List.Item key={league.id}>
                            <AnchorLink params={{ leagueId: league.id }} to="/leagues/$leagueId">
                                {league.name}
                            </AnchorLink>
                        </List.Item>
                    ))}
                </List>
                {canCreate && <CreateLeague organizationId={organizationId} />}
            </Stack>
        </Container>
    );
}
