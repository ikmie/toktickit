import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { signToken } from '../../src/utils/auth';

describe('Lab 04 - Ticket Resolution Gate & Transition Workflow', () => {
  const requesterToken = signToken({
    id: 1,
    email: 'supanut.soph@kmutt.ac.th',
    name: 'Supanut Sopha',
    role: 'REQUESTER',
  });

  const staffToken = signToken({
    id: 7,
    email: 'michael.b@toktickit.com',
    name: 'Michael Brown',
    role: 'IT_STAFF',
  });

  it('strictly enforces Resolution Gate, advisory requester indication, concurrency protection, and lifecycle closure', async () => {
    // 1. Requester creates ticket
    const createRes = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: 'E2E Resolution Gate Verification Ticket',
        description: 'Testing that status cannot be marked RESOLVED without action taken.',
        requestedPriority: 'HIGH',
      });

    expect(createRes.status).toBe(201);
    const ticketId = createRes.body.id;

    // 2. Staff claims ticket (NEW -> OPEN)
    const claimRes = await request(app)
      .patch(`/api/staff/tickets/${ticketId}/claim`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(claimRes.status).toBe(200);

    // 3. Staff advances to IN_PROGRESS
    const advanceRes = await request(app)
      .patch(`/api/staff/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'IN_PROGRESS' });
    expect(advanceRes.status).toBe(200);

    // 4. RESOLUTION GATE CHECK: Staff attempts to resolve ticket with ZERO Actions Taken
    const blockedResolveRes = await request(app)
      .patch(`/api/staff/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        status: 'RESOLVED',
        resolutionSummary: 'Attempting to resolve without actions recorded.',
      });

    expect(blockedResolveRes.status).toBe(400);
    expect(blockedResolveRes.body.message).toMatch(/without at least one recorded action taken/i);

    // 5. Requester indicates problem resolved (Advisory only)
    const indicateRes = await request(app)
      .post(`/api/tickets/${ticketId}/resolve-indication`)
      .set('Authorization', `Bearer ${requesterToken}`);

    expect(indicateRes.status).toBe(200);
    expect(indicateRes.body.problemResolvedIndicated).toBe(true);
    // Ticket status remains IN_PROGRESS (not changed to RESOLVED)
    expect(indicateRes.body.ticket.currentStatus).toBe('IN_PROGRESS');

    // 6. IT Staff records mandatory Action Taken
    const actionRes = await request(app)
      .post(`/api/tickets/${ticketId}/actions`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        description: 'Reconfigured network DNS parameters and flushed local cache.',
        result: 'DNS resolution latency reduced to 8ms; full connectivity verified.',
        followUpRequired: false,
      });

    expect(actionRes.status).toBe(201);

    // 7. OPTIMISTIC CONCURRENCY CHECK: Submit stale expectedUpdatedAt
    const staleResolveRes = await request(app)
      .patch(`/api/staff/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        status: 'RESOLVED',
        resolutionSummary: 'DNS parameters flushed.',
        expectedUpdatedAt: '2020-01-01T00:00:00.000Z', // intentionally stale timestamp
      });

    expect(staleResolveRes.status).toBe(409);
    expect(staleResolveRes.body.error).toMatch(/Conflict/i);

    // Fetch fresh ticket data to get authoritative updatedAt
    const freshTicketRes = await request(app)
      .get(`/api/staff/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(freshTicketRes.status).toBe(200);

    // 8. RESOLUTION SUCCESS: With Action Taken present and valid updatedAt, resolve succeeds
    const successfulResolveRes = await request(app)
      .patch(`/api/staff/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        status: 'RESOLVED',
        resolutionSummary: 'DNS cache flushed and stable operation confirmed.',
        expectedUpdatedAt: freshTicketRes.body.updatedAt,
      });

    expect(successfulResolveRes.status).toBe(200);
    expect(successfulResolveRes.body.currentStatus).toBe('RESOLVED');

    // 9. Final lifecycle closure (RESOLVED -> CLOSED)
    const closeRes = await request(app)
      .patch(`/api/staff/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        status: 'CLOSED',
      });

    expect(closeRes.status).toBe(200);
    expect(closeRes.body.currentStatus).toBe('CLOSED');
  });
});
