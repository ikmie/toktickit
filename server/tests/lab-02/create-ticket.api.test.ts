import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Lab 02 - Create Ticket API Tests', () => {
  it('should generate ticket number in format TKT-YYYY-XXXXXX and return 201', async () => {
    const response = await request(app)
      .post('/api/tickets')
      .set('X-Requester-Id', '1')
      .send({
        categoryId: 2,
        relatedSystemId: 7,
        summary: 'Unit test ticket summary text',
        description: 'Detailed unit test ticket description with sufficient length.',
        requestedPriority: 'HIGH',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('ticketNumber');
    expect(response.body.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(response.body.currentStatus).toBe('NEW');
    expect(response.body.itPriority).toBe('MEDIUM');
    expect(response.body.requesterId).toBe(1);
  });

  it('should return 400 validation error when summary or description is invalid', async () => {
    const response = await request(app)
      .post('/api/tickets')
      .set('X-Requester-Id', '1')
      .send({
        categoryId: 2,
        relatedSystemId: 7,
        summary: 'Short', // < 5 chars
        description: 'Short', // < 10 chars
        requestedPriority: 'HIGH',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation Error');
    expect(response.body.details.length).toBeGreaterThan(0);
  });

  it('should return 400 when requester identity is missing', async () => {
    const response = await request(app)
      .post('/api/tickets')
      .send({
        categoryId: 2,
        relatedSystemId: 7,
        summary: 'Valid summary for test ticket',
        description: 'Valid description for test ticket with sufficient length.',
        requestedPriority: 'MEDIUM',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Requester Identity Required');
  });
});
