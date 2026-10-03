import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { type FormEvent, useState } from 'react';
import { z } from 'zod';

import { authClient } from '../auth-client';

const signInSearchSchema = z.object({
    returnTo: z.string().optional()
        .catch(undefined),
});

export function safeReturnTo(value: string | undefined): string {
    if (!value) {
        return '/';
    }

    const url = URL.parse(value, location.origin);
    if (!url || url.origin !== location.origin) {
        return '/';
    }

    return `${url.pathname}${url.search}${url.hash}`;
}

export const Route = createFileRoute('/sign-in')({
    component: SignInRoute,
    validateSearch: (search: Record<string, unknown>) => ({
        returnTo: safeReturnTo(signInSearchSchema.parse(search).returnTo),
    }),
});

function SignInRoute() {
    const { returnTo } = Route.useSearch();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [pending, setPending] = useState(false);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');
        setPending(true);
        try {
            const result = await authClient.signIn.email({ email, password });
            if (result.error) {
                setError(result.error.message ?? 'Unable to sign in.');
            } else {
                void navigate({ to: returnTo });
            }
        } catch {
            setError('Unable to sign in.');
        } finally {
            setPending(false);
        }
    }

    return (
        <main>
            <h1>Sign in</h1>
            <form onSubmit={event => void submit(event)}>
                <label htmlFor="email">Email</label>
                <input
                    autoComplete="email"
                    id="email"
                    onChange={event => setEmail(event.currentTarget.value)}
                    required
                    type="email"
                    value={email}
                />
                <label htmlFor="password">Password</label>
                <input
                    autoComplete="current-password"
                    id="password"
                    onChange={event => setPassword(event.currentTarget.value)}
                    required
                    type="password"
                    value={password}
                />
                {error && <p role="alert">{error}</p>}
                <button disabled={pending} type="submit">
                    {pending ? 'Signing in…' : 'Sign in'}
                </button>
            </form>
        </main>
    );
}
