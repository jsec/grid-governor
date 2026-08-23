import { createFileRoute } from '@tanstack/react-router';

/*
 * Placeholder landing route so the file-based tree compiles. Replace with real
 * routes as features are built.
 */
export const Route = createFileRoute('/')({
    component: Index,
});

function Index() {
    return null;
}
