import { Container, List, Stack, Text, Title } from '@mantine/core';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { AnchorLink } from '../../components/anchor-link';
import { organizationListQuery } from '../../queries/organizations';

export const Route = createFileRoute('/_authenticated/')({
    component: HomeRoute,
    loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(organizationListQuery()),
});

function HomeRoute() {
    const { data: organizations } = useSuspenseQuery(organizationListQuery());

    return (
        <Container py="xl">
            <Stack>
                <Title order={1}>Organizations</Title>
                {organizations.length === 0 && (
                    <Text>You aren't a member of any organization yet.</Text>
                )}
                <List>
                    {organizations.map(organization => (
                        <List.Item key={organization.id}>
                            <AnchorLink
                                params={{ organizationId: organization.id }}
                                to="/organizations/$organizationId/leagues"
                            >
                                {organization.name}
                            </AnchorLink>
                        </List.Item>
                    ))}
                </List>
            </Stack>
        </Container>
    );
}
