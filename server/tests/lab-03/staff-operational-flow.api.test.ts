import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { signToken } from '../../src/utils/auth';

describe('Lab 03 - E2E IT Staff Operational Flow', () => {
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

  it('should complete full operational lifecycle: creation, triage, internal notes, resolution indication, and closure', async () => {
    // 1. Requester creates a new ticket
    const createRes = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: 'E2E Lab 3 Staff Operational Lifecycle Test',
        description: 'Testing staff triage, claim, priority, internal notes, and lifecycle resolution.',
        requestedPriority: 'MEDIUM',
      });

    expect(createRes.status).toBe(201);
    const ticketId = createRes.body.id;
    const ticketNumber = createRes.body.ticketNumber;

    // 2. Requester adds a public comment
    const commentRes = await request(app)
      .post(`/api/tickets/${ticketId}/comments`)
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({ content: 'I need this resolved before tomorrow morning.' });

    expect(commentRes.status).toBe(201);

    // 3. IT Staff searches ticket queue for this ticket
    const queueRes = await request(app)
      .get(`/api/staff/tickets?search=${ticketNumber}`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(queueRes.status).toBe(200);
    expect(queueRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(queueRes.body.data[0].ticketNumber).toBe(ticketNumber);

    // 4. IT Staff claims the unassigned ticket -> status advances NEW -> OPEN
    const claimRes = await request(app)
      .patch(`/api/staff/tickets/${ticketId}/claim`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(claimRes.status).toBe(200);
    expect(claimRes.body.ticket.ownerId).toBe(7);
    expect(claimRes.body.ticket.currentStatus).toBe('OPEN');

    // 5. IT Staff updates operational IT Priority to URGENT
    const priorityRes = await request(app)
      .patch(`/api/staff/tickets/${ticketId}/priority`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ itPriority: 'URGENT' });

    expect(priorityRes.status).toBe(200);
    expect(priorityRes.body.itPriority).toBe('URGENT');

    // 6. IT Staff posts a confidential Internal Note (BR-15)
    const noteRes = await request(app)
      .post(`/api/tickets/${ticketId}/notes`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ content: 'Confidential: vendor escalated ticket RMA #99812' });

    expect(noteRes.status).toBe(201);

    // 7. Security check: Requester MUST NOT be able to read internal notes (403)
    const breachRes = await request(app)
      .get(`/api/tickets/${ticketId}/notes`)
      .set('Authorization', `Bearer ${requesterToken}`);

    expect(breachRes.status).toBe(403);

    // 8. Requester signals "Problem Appears Resolved" (FR-07)
    const resolveIndRes = await request(app)
      .post(`/api/tickets/${ticketId}/resolve-indication`)
      .set('Authorization', `Bearer ${requesterToken}`);

    expect(resolveIndRes.status).toBe(200);
    expect(resolveIndRes.body.ticket.problemResolvedIndicated).toBe(true);

    // 9. IT Staff views ticket detail and observes resolution indicator
    const detailRes = await request(app)
      .get(`/api/staff/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.problemResolvedIndicated).toBe(true);
    expect(detailRes.body.notes.length).toBeGreaterThanOrEqual(1);

    // 9b. IT Staff records an Action Taken before resolving (Lab 4 Resolution Gate)
    await request(app)
      .post(`/api/tickets/${ticketId}/actions`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        description: 'Completed investigation and fixed issue.',
        result: 'Verified working with user.',
      });

    // 10. IT Staff transitions status to RESOLVED with resolution summary (BR-14)
    const statusRes = await request(app)
      .patch(`/api/staff/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        status: 'RESOLVED',
        resolutionSummary: 'Verified operational stability and confirmed with requester.',
      });

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.currentStatus).toBe('RESOLVED');
  });
});
