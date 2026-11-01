import type { leagueSchema, updateLeagueSchema } from '@grid-governor/core/schemas';
import type { FormEvent } from 'react';

import { errorBodySchema } from '@grid-governor/core/schemas';
import { Alert, Button, NumberInput, Stack, TextInput } from '@mantine/core';
import { HTTPError } from 'ky';
import { z } from 'zod';

const optionalNumber = z.string().transform((value) => {
    if (value === '') {
        return null;
    }

    return Number(value);
});

const DEFAULT_RULING_SLA_HOURS = 24;

const leagueFormSchema = z.object({
    banLengthRounds: optionalNumber,
    name: z.string(),
    rulingSlaHours: z.coerce.number(),
    suspensionThresholdPoints: optionalNumber,
});

export type LeagueFormValues = z.input<typeof updateLeagueSchema>;

type LeagueFormProps = {
    error: Error | null;
    isPending: boolean;
    league?: z.infer<typeof leagueSchema>;
    onSubmit: (values: LeagueFormValues, form: HTMLFormElement) => void;
    submitLabel: string;
};

export function LeagueForm({ error, isPending, league, onSubmit, submitLabel }: LeagueFormProps) {
    const errorBody = errorBodySchema.safeParse(error instanceof HTTPError ? error.data : null);
    const issues = errorBody.data?.issues ?? [];
    const fieldError = (field: keyof LeagueFormValues) =>
        issues.find(issue => issue.path[0] === field)?.message;

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const entries = Object.fromEntries(new FormData(form));

        const values = leagueFormSchema.parse(entries);

        onSubmit(values, form);
    };

    return (
        <form onSubmit={submit}>
            <Stack align="flex-start">
                <TextInput
                    defaultValue={league?.name}
                    error={fieldError('name')}
                    label="Name"
                    name="name"
                    required
                />
                <NumberInput
                    allowDecimal={false}
                    defaultValue={league?.rulingSlaHours ?? DEFAULT_RULING_SLA_HOURS}
                    error={fieldError('rulingSlaHours')}
                    label="Ruling deadline (hours)"
                    min={1}
                    name="rulingSlaHours"
                    required
                />
                <NumberInput
                    allowDecimal={false}
                    defaultValue={league?.suspensionThresholdPoints ?? ''}
                    description="Leave empty to use the organization's value"
                    error={fieldError('suspensionThresholdPoints')}
                    label="Suspension threshold (points)"
                    min={1}
                    name="suspensionThresholdPoints"
                />
                <NumberInput
                    allowDecimal={false}
                    defaultValue={league?.banLengthRounds ?? ''}
                    description="Leave empty to use the organization's value"
                    error={fieldError('banLengthRounds')}
                    label="Ban length (rounds)"
                    min={1}
                    name="banLengthRounds"
                />
                {error && issues.length === 0 && (
                    <Alert color="red" role="alert">{errorBody.data?.error ?? error.message}</Alert>
                )}
                <Button loading={isPending} type="submit">{submitLabel}</Button>
            </Stack>
        </form>
    );
}
