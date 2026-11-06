import { roundSchema } from '@grid-governor/core/schemas';
import { createTestDatabase, type TestDatabase } from '@grid-governor/core/testing/database';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, seedOrganization, signIn } from '../../test/helpers.ts';

const roundBody = {
    startsAt: null,
    track: 'Spa',
};

type TestRequest = {
    body?: object;
    email: string;
    method: string;
    path: string;
};

describe('round routes', () => {
    let fixture: TestDatabase;
    let seasonId: string;
    let roundsPath: string;
    let request: (options: TestRequest) => Promise<Response>;

    beforeEach(async () => {
        fixture = await createTestDatabase();
        await seedOrganization(fixture.db);

        const { leagueId } = await fixture.db.insertInto('league')
            .values({ name: 'Sunday Cup', organizationId: 'grid-club' })
            .returning('leagueId')
            .executeTakeFirstOrThrow();

        await fixture.db.insertInto('leagueMembership')
            .values([
                {
                    leagueId,
                    role: 'manager',
                    userId: 'member',
                },
                {
                    leagueId,
                    role: 'steward',
                    userId: 'driver',
                },
            ])
            .execute();

        const season = await fixture.db.insertInto('season')
            .values({
                leagueId,
                name: '2026',
                platform: 'iracing',
                pointsScheme: [25, 18, 15],
            })
            .returning('seasonId')
            .executeTakeFirstOrThrow();

        seasonId = season.seasonId;
        roundsPath = `/api/seasons/${seasonId}/rounds`;

        const { app, auth } = createTestApp(fixture.db);

        request = async ({ body, email, method, path }) => {
            const cookie = await signIn(auth, email);

            return app.request(path, {
                body: JSON.stringify(body),
                headers: { 'content-type': 'application/json', cookie },
                method,
            });
        };
    });

    afterEach(async () => {
        await fixture.destroy();
    });

    async function auditChanges() {
        return fixture.db
            .selectFrom('auditEntry')
            .select(['action', 'actorRole', 'changes', 'targetType'])
            .execute();
    }

    async function insertRound(ordinal: number, track: string) {
        const { roundId } = await fixture.db.insertInto('round')
            .values({
                ordinal,
                seasonId,
                track,
            })
            .returning('roundId')
            .executeTakeFirstOrThrow();

        return roundId;
    }

    async function insertEntry() {
        const { driverId } = await fixture.db.insertInto('driver')
            .values({
                displayName: 'Dee Driver',
                platform: 'iracing',
                simId: 'sim-1',
            })
            .returning('driverId')
            .executeTakeFirstOrThrow();

        const { entryId } = await fixture.db.insertInto('entry')
            .values({
                carNumber: 7,
                driverId,
                platform: 'iracing',
                seasonId,
            })
            .returning('entryId')
            .executeTakeFirstOrThrow();

        return entryId;
    }

    async function insertIncident(roundId: string, entryId: string) {
        const { offenseId } = await fixture.db.insertInto('offense')
            .values({
                code: 'causing-collision',
                description: 'Caused a collision',
                displayOrder: 1,
                name: 'Causing a collision',
                offenseGroup: 'on_track',
            })
            .returning('offenseId')
            .executeTakeFirstOrThrow();

        const { incidentId } = await fixture.db.insertInto('incident')
            .values({
                accusedEntryId: entryId,
                offenseId,
                roundId,
                seasonId,
            })
            .returning('incidentId')
            .executeTakeFirstOrThrow();

        return incidentId;
    }

    describe('PUT /api/rounds/:roundId', () => {
        it('should let a manager change both fields and record the changes', async () => {
            const roundId = await insertRound(1, 'Spa');
            const path = `/api/rounds/${roundId}`;

            const response = await request({
                body: { startsAt: '2026-11-08T14:00:00+10:00', track: 'Monza' },
                email: 'member@example.test',
                method: 'PUT',
                path,
            });
            const body = await response.json();

            const changes = await auditChanges();

            expect(response.status).toBe(200);
            expect(roundSchema.parse(body)).toMatchObject({
                id: roundId,
                ordinal: 1,
                startsAt: '2026-11-08T04:00:00.000Z',
                track: 'Monza',
            });
            expect(changes).toEqual([{
                action: 'update',
                actorRole: 'manager',
                changes: [
                    {
                        field: 'startsAt',
                        from: null,
                        to: '2026-11-08T04:00:00.000Z',
                    },
                    {
                        field: 'track',
                        from: 'Spa',
                        to: 'Monza',
                    },
                ],
                targetType: 'round',
            }]);
        });

        it('should record nothing for the same start time in another offset', async () => {
            const roundId = await insertRound(1, 'Spa');
            const path = `/api/rounds/${roundId}`;
            await fixture.db.updateTable('round')
                .set({ startsAt: '2026-11-08T04:00:00Z' })
                .execute();

            const response = await request({
                body: { startsAt: '2026-11-08T14:00:00+10:00', track: 'Spa' },
                email: 'owner@example.test',
                method: 'PUT',
                path,
            });
            const body = await response.json();

            const changes = await auditChanges();

            expect(response.status).toBe(200);
            expect(roundSchema.parse(body)).toMatchObject({ startsAt: '2026-11-08T04:00:00.000Z' });
            expect(changes).toEqual([]);
        });

        it('should edit a round that has a result', async () => {
            const roundId = await insertRound(1, 'Spa');
            const path = `/api/rounds/${roundId}`;
            const entryId = await insertEntry();
            await fixture.db.insertInto('result')
                .values({
                    entryId,
                    roundId,
                    seasonId,
                })
                .execute();

            const response = await request({
                body: { ...roundBody, track: 'Monza' },
                email: 'owner@example.test',
                method: 'PUT',
                path,
            });
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(roundSchema.parse(body)).toMatchObject({ track: 'Monza' });
        });

        it('should respond 403 to a steward and record nothing', async () => {
            const roundId = await insertRound(1, 'Spa');
            const path = `/api/rounds/${roundId}`;

            const response = await request({
                body: { ...roundBody, track: 'Monza' },
                email: 'driver@example.test',
                method: 'PUT',
                path,
            });

            const changes = await auditChanges();

            expect(response.status).toBe(403);
            expect(changes).toEqual([]);
        });

        it('should respond 404 to a global admin who is not a member', async () => {
            const roundId = await insertRound(1, 'Spa');
            const path = `/api/rounds/${roundId}`;

            const response = await request({
                body: roundBody,
                email: 'global-admin@example.test',
                method: 'PUT',
                path,
            });

            expect(response.status).toBe(404);
        });

        it('should respond 404 for a round that does not exist', async () => {
            const response = await request({
                body: roundBody,
                email: 'owner@example.test',
                method: 'PUT',
                path: '/api/rounds/999',
            });

            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /api/rounds/:roundId', () => {
        it('should let a manager delete the last round and reuse its number', async () => {
            await insertRound(1, 'Spa');
            const roundId = await insertRound(2, 'Monza');

            const response = await request({
                email: 'member@example.test',
                method: 'DELETE',
                path: `/api/rounds/${roundId}`,
            });

            const changes = await auditChanges();

            expect(response.status).toBe(204);
            expect(changes).toEqual([{
                action: 'delete',
                actorRole: 'manager',
                changes: [
                    {
                        field: 'ordinal',
                        from: 2,
                        to: null,
                    },
                    {
                        field: 'startsAt',
                        from: null,
                        to: null,
                    },
                    {
                        field: 'track',
                        from: 'Monza',
                        to: null,
                    },
                ],
                targetType: 'round',
            }]);

            const created = await request({
                body: roundBody,
                email: 'member@example.test',
                method: 'POST',
                path: roundsPath,
            });
            const body = await created.json();

            expect(roundSchema.parse(body).ordinal).toBe(2);
        });

        it('should respond 409 to a round before the last and record nothing', async () => {
            const roundId = await insertRound(1, 'Spa');
            await insertRound(2, 'Monza');

            const response = await request({
                email: 'owner@example.test',
                method: 'DELETE',
                path: `/api/rounds/${roundId}`,
            });

            const changes = await auditChanges();

            expect(response.status).toBe(409);
            expect(changes).toEqual([]);
        });

        it('should respond 409 to a round with a result', async () => {
            const roundId = await insertRound(1, 'Spa');
            const entryId = await insertEntry();
            await fixture.db.insertInto('result')
                .values({
                    entryId,
                    roundId,
                    seasonId,
                })
                .execute();

            const response = await request({
                email: 'owner@example.test',
                method: 'DELETE',
                path: `/api/rounds/${roundId}`,
            });

            const changes = await auditChanges();

            expect(response.status).toBe(409);
            expect(changes).toEqual([]);
        });

        it('should respond 409 to a round with an incident', async () => {
            const roundId = await insertRound(1, 'Spa');
            const entryId = await insertEntry();
            await insertIncident(roundId, entryId);

            const response = await request({
                email: 'owner@example.test',
                method: 'DELETE',
                path: `/api/rounds/${roundId}`,
            });

            expect(response.status).toBe(409);
        });

        it('should respond 409 to a round with a race ban', async () => {
            const incidentRoundId = await insertRound(1, 'Spa');
            const bannedRoundId = await insertRound(2, 'Monza');
            const entryId = await insertEntry();
            const incidentId = await insertIncident(incidentRoundId, entryId);

            const { penaltyId } = await fixture.db.insertInto('penalty')
                .values({
                    code: 'race-ban',
                    label: 'Race ban',
                    severityRank: 1,
                })
                .returning('penaltyId')
                .executeTakeFirstOrThrow();

            await fixture.db.insertInto('ruling')
                .values({
                    authorUserId: 'owner',
                    banRounds: 1,
                    fault: 'predominant',
                    incidentId,
                    origin: 'original',
                    penaltyId,
                    reasoning: 'Clear fault at turn one.',
                    revision: 1,
                })
                .execute();

            await fixture.db.insertInto('raceBan')
                .values({
                    entryId,
                    incidentId,
                    roundId: bannedRoundId,
                    seasonId,
                    sourceRevision: 1,
                })
                .execute();

            const response = await request({
                email: 'owner@example.test',
                method: 'DELETE',
                path: `/api/rounds/${bannedRoundId}`,
            });

            expect(response.status).toBe(409);
        });

        it('should respond 403 to a steward and record nothing', async () => {
            const roundId = await insertRound(1, 'Spa');

            const response = await request({
                email: 'driver@example.test',
                method: 'DELETE',
                path: `/api/rounds/${roundId}`,
            });

            const changes = await auditChanges();

            expect(response.status).toBe(403);
            expect(changes).toEqual([]);
        });

        it('should respond 404 to a global admin who is not a member', async () => {
            const roundId = await insertRound(1, 'Spa');

            const response = await request({
                email: 'global-admin@example.test',
                method: 'DELETE',
                path: `/api/rounds/${roundId}`,
            });

            expect(response.status).toBe(404);
        });
    });
});
