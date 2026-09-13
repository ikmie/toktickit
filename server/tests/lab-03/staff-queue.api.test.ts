import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { signToken } from '../../src/utils/auth';

describe('Lab 03 - IT Staff Ticket Queue API Tests', () => {
  const staffToken = signToken({
    id: 7, // Michael Brown (IT Staff)
    email: 'michael.b@toktickit.com',
    name: 'Michael Brown',
    role: 'IT_STAFF',
  });

  const requesterToken = signToken({
    id: 1, // Supanut (Requester)
    email: 'supanut.soph@kmutt.ac.th',
    name: 'Supanut Sopha',
    role: 'REQUESTER',
  });

  it('TC-STF-01: should return 401 Unauthorized if no token provided', async () => {
    const res = await request(app).get('/api/staff/tickets');
    expect(res.status).toBe(401);
  });

  it('TC-STF-02: should return 403 Forbidden if requester accesses staff queue', async () => {
    const res = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${requesterToken}`);
    expect(res.status).toBe(403);
  });

  it('TC-STF-03: should allow IT Staff to query ticket queue with pagination', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?page=1&limit=5')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(5);
    expect(res.body.pagination.total).toBeGreaterThan(0);
  });

  it('TC-STF-04: should filter queue by search query (ticket number or summary)', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?search=VPN')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach((ticket: any) => {
      const matchNumber = ticket.ticketNumber.toLowerCase().includes('vpn');
      const matchSummary = ticket.summary.toLowerCase().includes('vpn');
      expect(matchNumber || matchSummary).toBe(true);
    });
  });

  it('TC-STF-05: should filter queue by itPriority', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?itPriority=HIGH')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach((ticket: any) => {
      expect(ticket.itPriority).toBe('HIGH');
    });
  });

  it('TC-STF-06: should filter queue by currentStatus', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?currentStatus=OPEN')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach((ticket: any) => {
      expect(ticket.currentStatus).toBe('OPEN');
    });
  });

  it('TC-STF-07: should filter queue by ownership (unassigned vs assignedToMe)', async () => {
    const unassignedRes = await request(app)
      .get('/api/staff/tickets?ownership=unassigned')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(unassignedRes.status).toBe(200);
    unassignedRes.body.data.forEach((ticket: any) => {
      expect(ticket.ownerId).toBeNull();
    });

    const myTicketsRes = await request(app)
      .get('/api/staff/tickets?ownership=assignedToMe')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(myTicketsRes.status).toBe(200);
    myTicketsRes.body.data.forEach((ticket: any) => {
      expect(ticket.ownerId).toBe(7);
    });
  });

  it('TC-STF-08: should list eligible active assignees excluding requesters and inactive staff', async () => {
    const res = await request(app)
      .get('/api/staff/assignees')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);

    res.body.forEach((user: any) => {
      expect(['IT_STAFF', 'ADMIN']).toContain(user.role);
    });

    // Make sure inactive staff (Daniel Miller, id 11) is excluded
    const inactiveStaff = res.body.find((u: any) => u.id === 11);
    expect(inactiveStaff).toBeUndefined();

    // Make sure requesters are excluded
    const requesterUser = res.body.find((u: any) => u.role === 'REQUESTER');
    expect(requesterUser).toBeUndefined();
  });
});
