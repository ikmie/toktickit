import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { signToken } from '../../src/utils/auth';

describe('Lab 04 - IT Staff & Admin Dashboard API Tests', () => {
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

  const adminToken = signToken({
    id: 12, // Admin User
    email: 'admin@toktickit.com',
    name: 'Admin User',
    role: 'ADMIN',
  });

  it('API-15: should return operational queue metrics and status breakdown for IT Staff', async () => {
    const res = await request(app)
      .get('/api/dashboards/staff')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('metrics');
    expect(res.body.metrics).toHaveProperty('new');
    expect(res.body.metrics).toHaveProperty('open');
    expect(res.body.metrics).toHaveProperty('inProgress');
    expect(res.body.metrics).toHaveProperty('waitingForRequester');
    expect(res.body.metrics).toHaveProperty('myAssigned');
    expect(res.body.metrics).toHaveProperty('unassigned');
    expect(res.body.metrics).toHaveProperty('urgentHigh');
    expect(res.body.metrics).toHaveProperty('recentActionsCount');

    expect(res.body).toHaveProperty('statusBreakdown');
    expect(res.body.statusBreakdown).toHaveProperty('NEW');
    expect(res.body.statusBreakdown).toHaveProperty('OPEN');
    expect(res.body.statusBreakdown).toHaveProperty('IN_PROGRESS');
    expect(res.body.statusBreakdown).toHaveProperty('RESOLVED');
    expect(res.body.statusBreakdown).toHaveProperty('CLOSED');

    expect(Array.isArray(res.body.recentTickets)).toBe(true);
    if (res.body.recentTickets.length > 0) {
      expect(res.body.recentTickets[0]).toHaveProperty('ticketNumber');
      expect(res.body.recentTickets[0]).toHaveProperty('actionsCount');
    }
  });

  it('API-16: should reject Requester from accessing IT Staff dashboard (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/dashboards/staff')
      .set('Authorization', `Bearer ${requesterToken}`);

    expect(res.status).toBe(403);
  });

  it('API-17: should return operational and user statistics for Admin on admin dashboard', async () => {
    const res = await request(app)
      .get('/api/dashboards/admin')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('operational');
    expect(res.body).toHaveProperty('userStats');
    expect(res.body.userStats).toHaveProperty('totalUsers');
    expect(res.body.userStats).toHaveProperty('activeUsers');
    expect(res.body.userStats).toHaveProperty('inactiveUsers');
    expect(res.body.userStats.byRole).toHaveProperty('REQUESTER');
    expect(res.body.userStats.byRole).toHaveProperty('IT_STAFF');
    expect(res.body.userStats.byRole).toHaveProperty('ADMIN');

    expect(typeof res.body.userStats.totalUsers).toBe('number');
    expect(res.body.userStats.totalUsers).toBeGreaterThan(0);
  });

  it('should reject non-admin from accessing admin dashboard', async () => {
    const res = await request(app)
      .get('/api/dashboards/admin')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(403);
  });
});
