import type { roundInputSchema } from '@grid-governor/core/schemas';
import type { FormEvent } from 'react';

import { errorBodySchema } from '@grid-governor/core/schemas';
import { Alert, Button, Stack, TextInput } from '@mantine/core';
import { HTTPError } from 'ky';
import { z } from 'zod';

const MILLISECONDS_PER_MINUTE = 60_000;
const DATETIME_LOCAL_LENGTH = 16;

const roundFormSchema = z.object({
    startsAt: z.string().transform((value) => {
        if (value === '') {
            return null;
        }

        return new Date(value).toISOString();
    }),
    track: z.string(),
});

export type RoundFormValues = z.input<typeof roundInputSchema>;

type RoundFormProps = {
    error: Error | null;
    isPending: boolean;
    onSubmit: (values: RoundFormValues) => void;
    round: RoundFormValues;
    submitLabel: string;
};

export function RoundForm({ error, isPending, onSubmit, round, submitLabel }: RoundFormProps) {
    const errorBody = errorBodySchema.safeParse(error instanceof HTTPError ? error.data : null);
    const issues = errorBody.data?.issues ?? [];
    const fieldError = (field: keyof RoundFormValues) =>
        issues.find(issue => issue.path[0] === field)?.message;

    const startsAt = round.startsAt === null ? '' : toDateTimeLocalValue(round.startsAt);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        const values = roundFormSchema.parse({
            startsAt: formData.get('startsAt'),
            track: formData.get('track'),
        });

        onSubmit(values);
    };

    return (
        <form onSubmit={submit}>
            <Stack align="flex-start">
                <TextInput
                    defaultValue={round.track}
                    error={fieldError('track')}
                    label="Track"
                    name="track"
                    required
                />
                <TextInput
                    defaultValue={startsAt}
                    description="Leave empty if the date isn't confirmed"
                    error={fieldError('startsAt')}
                    label="Start time"
                    name="startsAt"
                    type="datetime-local"
                />
                {error && issues.length === 0 && (
                    <Alert color="red" role="alert">{errorBody.data?.error ?? error.message}</Alert>
                )}
                <Button loading={isPending} type="submit">{submitLabel}</Button>
            </Stack>
        </form>
    );
}

function toDateTimeLocalValue(startsAt: string) {
    const date = new Date(startsAt);
    const offset = date.getTimezoneOffset() * MILLISECONDS_PER_MINUTE;

    return new Date(date.getTime() - offset).toISOString()
        .slice(0, DATETIME_LOCAL_LENGTH);
}
