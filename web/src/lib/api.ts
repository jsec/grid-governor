import { notFound } from '@tanstack/react-router';
import ky from 'ky';

const REQUEST_TIMEOUT = 10_000;

export const api = ky.create({
    baseUrl: `${location.origin}/api/`,
    hooks: {
        afterResponse: [
            ({ response }) => {
                if (response.status === 404) {
                    throw notFound();
                }
            },
        ],
    },
    retry: 0,
    timeout: REQUEST_TIMEOUT,
});
