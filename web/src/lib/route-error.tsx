import type { ErrorComponentProps } from '@tanstack/react-router';

import { Alert, Button, Container, Stack, Text, Title } from '@mantine/core';
import { useRouter } from '@tanstack/react-router';
import { HTTPError } from 'ky';
import { useEffect } from 'react';

export function NotFound() {
    return (
        <Container py="xl">
            <Title order={1}>Not found</Title>
            <Text>This page doesn't exist, or you don't have access to it.</Text>
        </Container>
    );
}

export function Pending() {
    return (
        <Container py="xl">
            <Text>Loading…</Text>
        </Container>
    );
}

export function RouteError({ error }: ErrorComponentProps) {
    const router = useRouter();
    const status = error instanceof HTTPError ? error.response.status : 0;
    const isSignedOut = status === 401;

    useEffect(() => {
        if (isSignedOut) {
            void router.navigate({
                replace: true,
                search: { returnTo: router.state.location.href },
                to: '/sign-in',
            });
        }
    }, [isSignedOut, router]);

    if (isSignedOut) {
        return null;
    }

    if (status === 403) {
        return (
            <Container py="xl">
                <Title order={1}>No access</Title>
                <Alert color="red" role="alert">You don't have access to this page.</Alert>
            </Container>
        );
    }

    return (
        <Container py="xl">
            <Stack align="flex-start">
                <Title order={1}>Something went wrong</Title>
                <Alert color="red" role="alert">This page couldn't be loaded.</Alert>
                <Button onClick={() => void router.invalidate()}>Try again</Button>
            </Stack>
        </Container>
    );
}
