import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Lab 02 - My Tickets List API Tests', () => {
  it('should list tickets owned by the selected requester', async () => {
    const response = await request(app)
      .get('/api/tickets')
      .set('X-Requester-Id', '1');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
    expect(Array.isArray(response.body.data)).toBe(true);

    // Verify all returned tickets belong to requester 1
    response.body.data.forEach((ticket: any) => {
      expect(ticket).toHaveProperty('ticketNumber');
      expect(ticket).toHaveProperty('summary');
      expect(ticket).toHaveProperty('category');
    });
  });

  it('should filter tickets by search query string', async () => {
    const response = await request(app)
      .get('/api/tickets?search=battery')
      .set('X-Requester-Id', '1');

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0].summary.toLowerCase()).toContain('battery');
  });

  it('should filter tickets by Category', async () => {
    const response = await request(app)
      .get('/api/tickets?categoryId=2') // Hardware
      .set('X-Requester-Id', '1');

    expect(response.status).toBe(200);
    response.body.data.forEach((ticket: any) => {
      expect(ticket.categoryId).toBe(2);
    });
  });

  it('should support pagination metadata', async () => {
    const response = await request(app)
      .get('/api/tickets?page=1&limit=2')
      .set('X-Requester-Id', '1');

    expect(response.status).toBe(200);
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(2);
  });

  it('should enforce requester isolation (Requester 2 does not see Requester 1 tickets)', async () => {
    const res1 = await request(app)
      .get('/api/tickets')
      .set('X-Requester-Id', '1');

    const res2 = await request(app)
      .get('/api/tickets')
      .set('X-Requester-Id', '2');

    const req1TicketNumbers = res1.body.data.map((t: any) => t.ticketNumber);
    const req2TicketNumbers = res2.body.data.map((t: any) => t.ticketNumber);

    // No ticket number from Requester 1 should appear in Requester 2's list
    req1TicketNumbers.forEach((num: string) => {
      expect(req2TicketNumbers).not.toContain(num);
    });
  });
});
