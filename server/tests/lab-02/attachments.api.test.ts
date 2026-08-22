import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Lab 02 - Attachment Lifecycle API Tests', () => {
  let testTicketId: number;

  beforeAll(async () => {
    // Create a fresh test ticket for attachment lifecycle tests
    const ticketRes = await request(app)
      .post('/api/tickets')
      .set('X-Requester-Id', '1')
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: 'Attachment test target ticket',
        description: 'Dedicated ticket created for attachment unit testing scenarios.',
        requestedPriority: 'LOW',
      });
    testTicketId = ticketRes.body.id;
  });

  it('should upload a valid PNG attachment to owned ticket', async () => {
    const buffer = Buffer.from('fake image binary content');
    const response = await request(app)
      .post(`/api/tickets/${testTicketId}/attachments`)
      .set('X-Requester-Id', '1')
      .attach('file', buffer, 'test_screenshot.png');

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.originalName).toBe('test_screenshot.png');
    expect(response.body.isRemoved).toBe(false);
  });

  it('should reject non-permitted attachment file types (.txt)', async () => {
    const buffer = Buffer.from('plain text content');
    const response = await request(app)
      .post(`/api/tickets/${testTicketId}/attachments`)
      .set('X-Requester-Id', '1')
      .attach('file', buffer, 'unsupported_document.txt');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid File Type');
  });

  it('should soft-remove an active attachment with reason', async () => {
    // 1. Upload a fresh active attachment first
    const buffer = Buffer.from('fresh active file content');
    const uploadRes = await request(app)
      .post(`/api/tickets/${testTicketId}/attachments`)
      .set('X-Requester-Id', '1')
      .attach('file', buffer, 'fresh_active.pdf');

    expect(uploadRes.status).toBe(201);
    const attachmentId = uploadRes.body.id;

    // 2. Soft-remove the uploaded attachment
    const response = await request(app)
      .patch(`/api/attachments/${attachmentId}/soft-remove`)
      .set('X-Requester-Id', '1')
      .send({ reason: 'File replaced with updated version' });

    expect(response.status).toBe(200);
    expect(response.body.isRemoved).toBe(true);
    expect(response.body.removedReason).toBe('File replaced with updated version');
  });

  it('should block download of soft-removed attachment', async () => {
    // Attachment 2 is soft-removed in seed data
    const response = await request(app)
      .get('/api/attachments/2/download')
      .set('X-Requester-Id', '1');

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('File Unavailable');
  });

  it('should deny downloading another requester attachment', async () => {
    const response = await request(app)
      .get('/api/attachments/1/download')
      .set('X-Requester-Id', '2'); // Requester 2 attempting to access Requester 1 file

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Access Denied');
  });
});
