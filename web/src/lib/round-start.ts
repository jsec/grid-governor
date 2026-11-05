const START_TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
});

export function formatRoundStart(startsAt: null | string) {
    if (startsAt === null) {
        return 'Date to be confirmed';
    }

    return START_TIME_FORMAT.format(new Date(startsAt));
}
