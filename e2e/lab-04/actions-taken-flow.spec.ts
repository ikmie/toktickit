import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/src/app';
import { signToken } from '../../server/src/utils/auth';

describe('Lab 04 - E2E Actions Taken Lifecycle & Multi-Staff Flow', () => {
  const requesterToken = signToken({
    id: 1,
    email: 'supanut.soph@kmutt.ac.th',
    name: 'Supanut Sopha',
    role: 'REQUESTER',
  });

  const staff1Token = signToken({
    id: 7,
    email: 'michael.b@toktickit.com',
    name: 'Michael Brown',
    role: 'IT_STAFF',
  });

  const staff2Token = signToken({
    id: 8,
    email: 'sarah.j@toktickit.com',
    name: 'Sarah Johnson',
    role: 'IT_STAFF',
  });

  it('completes full parent-child Actions Taken lifecycle across multiple IT Staff members and verifies Requester read-only audit visibility', async () => {
    // 1. Requester creates a new ticket
    const createTicketRes = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: 'E2E Lab 4 Actions Taken Lifecycle Multi-Staff Test',
        description: 'Server fan failed causing overheating alarms in rack 4.',
        requestedPriority: 'HIGH',
      });

    expect(createTicketRes.status).toBe(201);
    const ticketId = createTicketRes.body.id;

    // 2. Staff 1 claims the ticket and sets priority
    const claimRes = await request(app)
      .patch(`/api/staff/tickets/${ticketId}/claim`)
      .set('Authorization', `Bearer ${staff1Token}`);
    expect(claimRes.status).toBe(200);

    // 3. Staff 1 records the initial diagnostic Action Taken
    const action1Res = await request(app)
      .post(`/api/tickets/${ticketId}/actions`)
      .set('Authorization', `Bearer ${staff1Token}`)
      .send({
        description: 'Inspected rack 4 fan assembly and checked thermal sensors.',
        result: 'Sensor indicates fan unit 2 bearing failure.',
        followUpRequired: true,
        followUpNote: 'Order replacement 120mm server fan from warehouse.',
        attachmentNotes: 'thermal_diagnostic_log.txt',
      });

    expect(action1Res.status).toBe(201);
    expect(action1Res.body.action.performedById).toBe(7);
    expect(action1Res.body.action.followUpRequired).toBe(true);
    const action1Id = action1Res.body.action.id;

    // 4. Staff 2 (different IT staff member) records replacement Action Taken (BR-02: primary owner coordinates, different staff can take action)
    const action2Res = await request(app)
      .post(`/api/tickets/${ticketId}/actions`)
      .set('Authorization', `Bearer ${staff2Token}`)
      .send({
        description: 'Received replacement fan and swapped out defective unit.',
        result: 'Fan spinning at nominal 3200 RPM; temperatures returned to 38C.',
        followUpRequired: false,
        attachmentNotes: 'post_replacement_metrics.png',
      });

    expect(action2Res.status).toBe(201);
    expect(action2Res.body.action.performedById).toBe(8);
    expect(action2Res.body.action.followUpRequired).toBe(false);

    // 5. Staff 1 updates their earlier action notes
    const updateActionRes = await request(app)
      .put(`/api/tickets/${ticketId}/actions/${action1Id}`)
      .set('Authorization', `Bearer ${staff1Token}`)
      .send({
        description: 'Inspected rack 4 fan assembly and confirmed bearing failure. Dispatched RMA.',
        result: 'Sensor confirmed defective fan unit 2.',
        followUpRequired: false,
        followUpNote: null,
      });

    expect(updateActionRes.status).toBe(200);
    expect(updateActionRes.body.action.followUpRequired).toBe(false);

    // 6. Requester views their ticket actions (Read-only audit transparency)
    const requesterViewRes = await request(app)
      .get(`/api/tickets/${ticketId}/actions`)
      .set('Authorization', `Bearer ${requesterToken}`);

    expect(requesterViewRes.status).toBe(200);
    expect(requesterViewRes.body.actions.length).toBe(2);
    expect(requesterViewRes.body.actions[0].performedBy.name).toBeDefined();

    // 7. Security: Requester is strictly forbidden from creating Actions Taken
    const forbiddenCreateRes = await request(app)
      .post(`/api/tickets/${ticketId}/actions`)
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        description: 'Unauthorized requester attempt',
        result: 'Should fail',
      });

    expect(forbiddenCreateRes.status).toBe(403);

    // 8. Security: Requester is strictly forbidden from modifying Actions Taken
    const forbiddenUpdateRes = await request(app)
      .put(`/api/tickets/${ticketId}/actions/${action1Id}`)
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        description: 'Unauthorized update attempt',
        result: 'Should fail',
      });

    expect(forbiddenUpdateRes.status).toBe(403);
  });
});
