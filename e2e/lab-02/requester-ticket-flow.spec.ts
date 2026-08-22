import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/src/app';

describe('Lab 02 - E2E Requester Ticket Flow', () => {
  it('should complete full end-to-end requester workflow', async () => {
    // 1. Fetch active requesters
    const reqRes = await request(app).get('/api/requesters');
    expect(reqRes.status).toBe(200);
    expect(reqRes.body.length).toBeGreaterThan(0);
    const requester1 = reqRes.body[0];

    // 2. Create ticket under Requester 1
    const createRes = await request(app)
      .post('/api/tickets')
      .set('X-Requester-Id', requester1.id.toString())
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: 'E2E test ticket summary for flow verification',
        description: 'Detailed description for E2E end to end requester ticket flow test.',
        requestedPriority: 'URGENT',
      });

    expect(createRes.status).toBe(201);
    const createdTicket = createRes.body;
    expect(createdTicket.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);

    // 3. Retrieve My Tickets list for Requester 1
    const listRes = await request(app)
      .get('/api/tickets')
      .set('X-Requester-Id', requester1.id.toString());

    expect(listRes.status).toBe(200);
    const ticketNumbers = listRes.body.data.map((t: any) => t.ticketNumber);
    expect(ticketNumbers).toContain(createdTicket.ticketNumber);

    // 4. Retrieve Ticket Detail for owned ticket
    const detailRes = await request(app)
      .get(`/api/tickets/${createdTicket.id}`)
      .set('X-Requester-Id', requester1.id.toString());

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.ticketNumber).toBe(createdTicket.ticketNumber);

    // 5. Upload Attachment
    const uploadRes = await request(app)
      .post(`/api/tickets/${createdTicket.id}/attachments`)
      .set('X-Requester-Id', requester1.id.toString())
      .attach('file', Buffer.from('E2E attachment file body'), 'e2e_evidence.pdf');

    expect(uploadRes.status).toBe(201);
    const attachmentId = uploadRes.body.id;

    // 6. Soft Remove Attachment
    const removeRes = await request(app)
      .patch(`/api/attachments/${attachmentId}/soft-remove`)
      .set('X-Requester-Id', requester1.id.toString())
      .send({ reason: 'E2E soft removal verification' });

    expect(removeRes.status).toBe(200);
    expect(removeRes.body.isRemoved).toBe(true);

    // 7. Verify Requester Isolation (Requester 2 cannot view Requester 1's ticket)
    const isolateRes = await request(app)
      .get(`/api/tickets/${createdTicket.id}`)
      .set('X-Requester-Id', '2');

    expect(isolateRes.status).toBe(403);
  });
});
