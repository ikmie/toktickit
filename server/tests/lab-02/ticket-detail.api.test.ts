import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Lab 02 - Ticket Detail API Tests', () => {
  it('should return owned ticket detail for the selected requester', async () => {
    const response = await request(app)
      .get('/api/tickets/1')
      .set('X-Requester-Id', '1');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('ticketNumber');
    expect(response.body).toHaveProperty('summary');
    expect(response.body).toHaveProperty('description');
    expect(response.body).toHaveProperty('category');
    expect(response.body).toHaveProperty('attachments');
  });

  it('should return 403 Access Denied when requester requests a ticket belonging to another requester', async () => {
    // Ticket ID 1 belongs to Requester 1. Requester 2 should be denied.
    const response = await request(app)
      .get('/api/tickets/1')
      .set('X-Requester-Id', '2');

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Access Denied');
  });

  it('should return 404 Not Found for non-existent ticket', async () => {
    const response = await request(app)
      .get('/api/tickets/99999')
      .set('X-Requester-Id', '1');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Ticket Not Found');
  });
});
