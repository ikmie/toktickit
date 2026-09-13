import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import { signToken } from '../../src/utils/auth';

const prisma = new PrismaClient();

describe('Lab 03 - Admin User Management API Tests', () => {
  const adminToken = signToken({
    id: 12, // John Admin
    email: 'admin.john@toktickit.com',
    name: 'John Admin',
    role: 'ADMIN',
  });

  const staffToken = signToken({
    id: 7, // Michael Brown (Staff)
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

  beforeEach(async () => {
    // Ensure admin accounts and test user 5 are active
    await prisma.user.updateMany({
      where: { role: 'ADMIN' },
      data: { isActive: true },
    });
  });

  it('TC-ADM-01: should return 401 when no token is provided', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('TC-ADM-02: should return 403 when accessed by non-admin roles', async () => {
    const resStaff = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(resStaff.status).toBe(403);

    const resReq = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${requesterToken}`);
    expect(resReq.status).toBe(403);
  });

  it('TC-ADM-03: should allow Admin to list users with pagination and role filter', async () => {
    const res = await request(app)
      .get('/api/admin/users?role=IT_STAFF&page=1&limit=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach((u: any) => {
      expect(u.role).toBe('IT_STAFF');
      expect(u).not.toHaveProperty('passwordHash');
    });
  });

  it('TC-ADM-04: should allow Admin to create a new user with temporary password (FR-13)', async () => {
    const randomEmail = `new.user.${Date.now()}@kmutt.ac.th`;
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'New Test Engineer',
        email: randomEmail,
        department: 'Computer Engineering',
        role: 'REQUESTER',
        password: 'Temp@Password2026!',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(randomEmail.toLowerCase());
    expect(res.body.user.mustChangePassword).toBe(true);
    expect(res.body.user.isActive).toBe(true);
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('TC-ADM-05: should reject duplicate email creation (BR-16)', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Duplicate Guy',
        email: 'supanut.soph@kmutt.ac.th', // Existing email
        department: 'CPE',
        role: 'REQUESTER',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Duplicate Email');
  });

  it('TC-ADM-06: should allow Admin to edit user details (FR-14)', async () => {
    const res = await request(app)
      .put('/api/admin/users/5') // Pitchayut
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Pitchayut Updated',
        department: 'Robotics Engineering',
      });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Pitchayut Updated');
    expect(res.body.user.department).toBe('Robotics Engineering');
  });

  it('TC-ADM-07: should allow Admin to deactivate an active user (FR-15)', async () => {
    const res = await request(app)
      .patch('/api/admin/users/5/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.user.isActive).toBe(false);
  });

  it('TC-ADM-08: should prevent Admin from deactivating their own account (BR-17)', async () => {
    const res = await request(app)
      .patch('/api/admin/users/12/status') // Self (admin ID 12)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Forbidden Action');
    expect(res.body.message).toMatch(/cannot deactivate their own/i);
  });

  it('TC-ADM-09: should prevent deactivating or demoting the last active Administrator (BR-18)', async () => {
    // Currently we have 2 admins: ID 12 (John Admin) and ID 13 (Mary Admin).
    // Deactivate admin 13 first:
    const deact13 = await request(app)
      .patch('/api/admin/users/13/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(deact13.status).toBe(200);

    // Now only Admin 12 is active. Trying to demote Admin 12 should fail BR-18:
    const demoteRes = await request(app)
      .put('/api/admin/users/12')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'IT_STAFF' });

    expect(demoteRes.status).toBe(400);
    expect(demoteRes.body.error).toBe('Forbidden Action');
    expect(demoteRes.body.message).toMatch(/last active Administrator/i);

    // Reactivate Admin 13 for clean state
    await prisma.user.update({
      where: { id: 13 },
      data: { isActive: true },
    });
  });

  it('TC-ADM-10: should allow Admin to reset user password and enforce change on login (FR-16)', async () => {
    const res = await request(app)
      .post('/api/admin/users/5/reset-password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ newPassword: 'Reset@Temp2026!' });

    expect(res.status).toBe(200);
    expect(res.body.mustChangePassword).toBe(true);

    const user = await prisma.user.findUnique({ where: { id: 5 } });
    expect(user?.mustChangePassword).toBe(true);
  });
});
