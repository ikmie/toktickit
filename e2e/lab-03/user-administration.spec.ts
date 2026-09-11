import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/src/app';
import { signToken } from '../../server/src/utils/auth';

describe('Lab 03 - E2E User Administration & Governance Flow', () => {
  const adminToken = signToken({
    id: 12,
    email: 'admin.john@toktickit.com',
    name: 'John Admin',
    role: 'ADMIN',
  });

  it('should execute full user administration lifecycle with governance constraints', async () => {
    // 1. Admin queries user list
    const listRes = await request(app)
      .get('/api/admin/users?role=REQUESTER')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);

    // 2. Admin creates a new user with temporary password
    const uniqueEmail = `e2e.created.${Date.now()}@kmutt.ac.th`;
    const tempPassword = 'TempPassword2026!';

    const createRes = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E Governed User',
        email: uniqueEmail,
        department: 'Information Technology',
        role: 'IT_STAFF',
        password: tempPassword,
      });

    expect(createRes.status).toBe(201);
    const createdUser = createRes.body.user;
    expect(createdUser.mustChangePassword).toBe(true);
    expect(createdUser.isActive).toBe(true);

    // 3. New user signs in with temporary password
    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: uniqueEmail, password: tempPassword });

    expect(userLoginRes.status).toBe(200);
    expect(userLoginRes.body.user.mustChangePassword).toBe(true);

    // 4. Admin edits user profile
    const editRes = await request(app)
      .put(`/api/admin/users/${createdUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E Governed User - Senior',
        department: 'Enterprise Systems',
      });

    expect(editRes.status).toBe(200);
    expect(editRes.body.user.name).toBe('E2E Governed User - Senior');
    expect(editRes.body.user.department).toBe('Enterprise Systems');

    // 5. Admin deactivates and reactivates user
    const deactRes = await request(app)
      .patch(`/api/admin/users/${createdUser.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(deactRes.status).toBe(200);
    expect(deactRes.body.user.isActive).toBe(false);

    // Deactivated user cannot log in
    const deactLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: uniqueEmail, password: tempPassword });

    expect(deactLoginRes.status).toBe(403);
    expect(deactLoginRes.body.message).toMatch(/inactive/i);

    // Reactivate user
    const reactRes = await request(app)
      .patch(`/api/admin/users/${createdUser.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: true });

    expect(reactRes.status).toBe(200);
    expect(reactRes.body.user.isActive).toBe(true);

    // 6. Admin attempts self-deactivation -> rejected per BR-17
    const selfDeactRes = await request(app)
      .patch(`/api/admin/users/12/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(selfDeactRes.status).toBe(400);
    expect(selfDeactRes.body.error).toBe('Forbidden Action');
  });
});
