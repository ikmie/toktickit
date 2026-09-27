import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/src/app';
import { signToken } from '../../server/src/utils/auth';

describe('Lab 04 - E2E Role-Appropriate Dashboards & Access Protection', () => {
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

  const adminToken = signToken({
    id: 13,
    email: 'admin.somchai@toktickit.com',
    name: 'Somchai Jaidee',
    role: 'ADMIN',
  });

  it('delivers role-tailored dashboards and enforces role protection boundaries', async () => {
    // 1. Requester Dashboard: Authoritative metrics and isolation
    const reqDashRes = await request(app)
      .get('/api/dashboards/requester')
      .set('Authorization', `Bearer ${requesterToken}`);

    expect(reqDashRes.status).toBe(200);
    expect(reqDashRes.body).toHaveProperty('metrics');
    expect(reqDashRes.body.metrics).toHaveProperty('totalOpenTickets');
    expect(reqDashRes.body.metrics).toHaveProperty('inProgress');
    expect(reqDashRes.body.metrics).toHaveProperty('resolved');
    expect(reqDashRes.body.metrics).toHaveProperty('closed');
    expect(Array.isArray(reqDashRes.body.recentTickets)).toBe(true);

    // 2. IT Staff Dashboard: Operational queue metrics and unassigned counts
    const staffDashRes = await request(app)
      .get('/api/dashboards/staff')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(staffDashRes.status).toBe(200);
    expect(staffDashRes.body).toHaveProperty('metrics');
    expect(staffDashRes.body.metrics).toHaveProperty('new');
    expect(staffDashRes.body.metrics).toHaveProperty('open');
    expect(staffDashRes.body.metrics).toHaveProperty('inProgress');
    expect(staffDashRes.body.metrics).toHaveProperty('waitingForRequester');
    expect(staffDashRes.body.metrics).toHaveProperty('myAssigned');
    expect(staffDashRes.body.metrics).toHaveProperty('unassigned');
    expect(staffDashRes.body.metrics).toHaveProperty('urgentHigh');
    expect(staffDashRes.body).toHaveProperty('statusBreakdown');
    expect(Array.isArray(staffDashRes.body.recentTickets)).toBe(true);

    // 3. Administrator Dashboard: Operational metrics + User Account statistics
    const adminDashRes = await request(app)
      .get('/api/dashboards/admin')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminDashRes.status).toBe(200);
    expect(adminDashRes.body).toHaveProperty('operational');
    expect(adminDashRes.body).toHaveProperty('userStats');
    expect(adminDashRes.body.userStats).toHaveProperty('totalUsers');
    expect(adminDashRes.body.userStats).toHaveProperty('activeUsers');
    expect(adminDashRes.body.userStats).toHaveProperty('byRole');
    expect(adminDashRes.body.userStats.byRole).toHaveProperty('REQUESTER');
    expect(adminDashRes.body.userStats.byRole).toHaveProperty('IT_STAFF');
    expect(adminDashRes.body.userStats.byRole).toHaveProperty('ADMIN');

    // 4. Role Isolation Security: Requester cannot access Staff Dashboard (403)
    const forbiddenStaffRes = await request(app)
      .get('/api/dashboards/staff')
      .set('Authorization', `Bearer ${requesterToken}`);
    expect(forbiddenStaffRes.status).toBe(403);

    // 5. Role Isolation Security: Requester cannot access Admin Dashboard (403)
    const forbiddenAdminRes1 = await request(app)
      .get('/api/dashboards/admin')
      .set('Authorization', `Bearer ${requesterToken}`);
    expect(forbiddenAdminRes1.status).toBe(403);

    // 6. Role Isolation Security: IT Staff cannot access Admin Dashboard (403)
    const forbiddenAdminRes2 = await request(app)
      .get('/api/dashboards/admin')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(forbiddenAdminRes2.status).toBe(403);
  });
});
