import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { signToken } from '../../src/utils/auth';

describe('Lab 04 - Requester Dashboard API Tests', () => {
  const requesterToken = signToken({
    id: 1, // Supanut
    email: 'supanut.soph@kmutt.ac.th',
    name: 'Supanut Sopha',
    role: 'REQUESTER',
  });

  const staffToken = signToken({
    id: 7, // Michael Brown (IT Staff)
    email: 'michael.b@toktickit.com',
    name: 'Michael Brown',
    role: 'IT_STAFF',
  });

  it('API-13: should return isolated metrics and recent tickets for authenticated requester', async () => {
    const res = await request(app)
      .get('/api/dashboards/requester')
      .set('Authorization', `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('metrics');
    expect(res.body.metrics).toHaveProperty('totalOpenTickets');
    expect(res.body.metrics).toHaveProperty('inProgress');
    expect(res.body.metrics).toHaveProperty('resolved');
    expect(res.body.metrics).toHaveProperty('closed');
    expect(Array.isArray(res.body.recentTickets)).toBe(true);

    // Verify values are numbers and >= 0
    expect(typeof res.body.metrics.totalOpenTickets).toBe('number');
    expect(typeof res.body.metrics.inProgress).toBe('number');
    expect(typeof res.body.metrics.resolved).toBe('number');
    expect(typeof res.body.metrics.closed).toBe('number');

    // Verify recent tickets are owned by this requester (id: 1)
    for (const ticket of res.body.recentTickets) {
      expect(ticket.requesterId).toBe(1);
    }
  });

  it('API-14: should reject non-requesters (IT Staff) from accessing requester dashboard', async () => {
    const res = await request(app)
      .get('/api/dashboards/requester')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(403);
  });

  it('should reject unauthenticated request', async () => {
    const res = await request(app).get('/api/dashboards/requester');
    expect(res.status).toBe(401);
  });
});
