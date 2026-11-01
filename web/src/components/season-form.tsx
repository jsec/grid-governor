import type { seasonInputSchema } from '@grid-governor/core/schemas';
import type { FormEvent } from 'react';

import { errorBodySchema } from '@grid-governor/core/schemas';
import {
    Alert,
    Button,
    Group,
    Input,
    NumberInput,
    Stack,
    Text,
    TextInput,
} from '@mantine/core';
import { HTTPError } from 'ky';
import { useState } from 'react';
import { z } from 'zod';

const optionalNumber = z.string().transform((value) => {
    if (value === '') {
        return null;
    }

    return Number(value);
});

const seasonFormSchema = z.object({
    dropWorst: z.coerce.number(),
    expiryRounds: optionalNumber,
    fastestLapBonus: z.coerce.number(),
    name: z.string(),
    pointsScheme: z.array(z.coerce.number()),
    poleBonus: z.coerce.number(),
});

export type SeasonFormValues = z.input<typeof seasonInputSchema>;

type SeasonFormProps = {
    error: Error | null;
    isPending: boolean;
    isScoringLocked: boolean;
    onSubmit: (values: SeasonFormValues) => void;
    season: SeasonFormValues;
    submitLabel: string;
};

export function SeasonForm({
    error,
    isPending,
    isScoringLocked,
    onSubmit,
    season,
    submitLabel,
}: SeasonFormProps) {
    const [positionCount, setPositionCount] = useState(season.pointsScheme.length);

    const errorBody = errorBodySchema.safeParse(error instanceof HTTPError ? error.data : null);
    const issues = errorBody.data?.issues ?? [];
    const fieldError = (field: keyof SeasonFormValues) =>
        issues.find(issue => issue.path[0] === field)?.message;

    const isConflict = error instanceof HTTPError && error.response.status === 409;
    const errorMessage = isConflict
        ? 'A season with that name already exists in this league.'
        : errorBody.data?.error ?? error?.message;

    const positions = Array.from({ length: positionCount }, (_, index) => index);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        const values = seasonFormSchema.parse({
            dropWorst: formData.get('dropWorst'),
            expiryRounds: formData.get('expiryRounds'),
            fastestLapBonus: formData.get('fastestLapBonus'),
            name: formData.get('name'),
            pointsScheme: formData.getAll('pointsScheme'),
            poleBonus: formData.get('poleBonus'),
        });

        onSubmit(values);
    };

    return (
        <form onSubmit={submit}>
            <Stack align="flex-start">
                <TextInput
                    defaultValue={season.name}
                    error={fieldError('name')}
                    label="Name"
                    name="name"
                    required
                />
                {isScoringLocked && (
                    <Text>The scoring can't change because this season has results.</Text>
                )}
                <Input.Wrapper
                    error={fieldError('pointsScheme')}
                    label="Points by finishing position"
                >
                    <Group>
                        {positions.map(index => (
                            <NumberInput
                                allowDecimal={false}
                                defaultValue={season.pointsScheme[index] ?? 0}
                                key={index}
                                label={`Position ${index + 1}`}
                                min={0}
                                name="pointsScheme"
                                readOnly={isScoringLocked}
                                required
                                w={100}
                            />
                        ))}
                    </Group>
                </Input.Wrapper>
                <Group>
                    <Button
                        disabled={isScoringLocked}
                        onClick={() => setPositionCount(positionCount + 1)}
                        variant="default"
                    >
                        Add position
                    </Button>
                    <Button
                        disabled={isScoringLocked || positionCount === 1}
                        onClick={() => setPositionCount(positionCount - 1)}
                        variant="default"
                    >
                        Remove last position
                    </Button>
                </Group>
                <NumberInput
                    allowDecimal={false}
                    defaultValue={season.poleBonus}
                    error={fieldError('poleBonus')}
                    label="Pole bonus (points)"
                    min={0}
                    name="poleBonus"
                    readOnly={isScoringLocked}
                    required
                />
                <NumberInput
                    allowDecimal={false}
                    defaultValue={season.fastestLapBonus}
                    error={fieldError('fastestLapBonus')}
                    label="Fastest lap bonus (points)"
                    min={0}
                    name="fastestLapBonus"
                    readOnly={isScoringLocked}
                    required
                />
                <NumberInput
                    allowDecimal={false}
                    defaultValue={season.dropWorst}
                    error={fieldError('dropWorst')}
                    label="Dropped rounds"
                    min={0}
                    name="dropWorst"
                    readOnly={isScoringLocked}
                    required
                />
                <NumberInput
                    allowDecimal={false}
                    defaultValue={season.expiryRounds ?? ''}
                    description="Leave empty for penalty points to expire at the end of the season"
                    error={fieldError('expiryRounds')}
                    label="Penalty points expire after (rounds)"
                    min={1}
                    name="expiryRounds"
                    readOnly={isScoringLocked}
                />
                {error && issues.length === 0 && (
                    <Alert color="red" role="alert">{errorMessage}</Alert>
                )}
                <Button loading={isPending} type="submit">{submitLabel}</Button>
            </Stack>
        </form>
    );
}
