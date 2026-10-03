import type { CreateEmailOptions, Resend } from 'resend';

export const emailConfig = {
    INVITATION_FROM_EMAIL: 'invites@example.test',
    WEB_URL: 'https://grid.example.test',
};

export function failingEmails(failure: Error): Pick<Resend['emails'], 'send'> {
    return {
        async send() {
            throw failure;
        },
    };
}

export function recordEmails() {
    const sent: CreateEmailOptions[] = [];
    const emails: Pick<Resend['emails'], 'send'> = {
        async send(email) {
            sent.push(email);

            return { data: { id: `email-${sent.length}` }, error: null, headers: null };
        },
    };

    return { emails, sent };
}
