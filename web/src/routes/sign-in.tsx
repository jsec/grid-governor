import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useActionState } from 'react';
import { z } from 'zod';

import { authClient } from '../auth-client';

export function safeReturnTo(value: string): string {
    const url = URL.parse(value, location.origin);
    if (!url || url.origin !== location.origin) {
        return '/';
    }

    return `${url.pathname}${url.search}${url.hash}`;
}

export const Route = createFileRoute('/sign-in')({
    component: SignInRoute,
    validateSearch: z.object({
        returnTo: z.string().catch('/')
            .transform(safeReturnTo),
    }),
});

function SignInRoute() {
    const { returnTo } = Route.useSearch();
    const navigate = useNavigate();
    const [error, submit, pending] = useActionState(async (_: string, form: FormData) => {
        try {
            const result = await authClient.signIn.email({
                email: String(form.get('email')),
                password: String(form.get('password')),
            });
            if (result.error) {
                return result.error.message ?? 'Unable to sign in.';
            }
            await navigate({ to: returnTo });
            return '';
        } catch {
            return 'Unable to sign in.';
        }
    }, '');

    return (
        <main>
            <h1>Sign in</h1>
            <form action={submit}>
                <label htmlFor="email">Email</label>
                <input autoComplete="email" id="email" name="email" required type="email" />
                <label htmlFor="password">Password</label>
                <input
                    autoComplete="current-password"
                    id="password"
                    name="password"
                    required
                    type="password"
                />
                {error && <p role="alert">{error}</p>}
                <button disabled={pending} type="submit">
                    {pending ? 'Signing in…' : 'Sign in'}
                </button>
            </form>
        </main>
    );
}
