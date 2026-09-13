import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../server/src/app';
import { hashPassword } from '../../server/src/utils/auth';

const prisma = new PrismaClient();

describe('Lab 03 - E2E Authentication & Password Change Flow', () => {
  const testEmail = 'alex.t@toktickit.com';
  const initialTempPassword = 'Password123!';
  const newStrongPassword = 'BrandNew@Secret2026!';

  beforeAll(async () => {
    // Reset Alex Thompson (User 10) to mustChangePassword: true with initial temp password
    const hashed = await hashPassword(initialTempPassword);
    await prisma.user.update({
      where: { id: 10 },
      data: {
        passwordHash: hashed,
        mustChangePassword: true,
        isActive: true,
      },
    });
  });

  it('should complete end-to-end mandatory first-login password change flow', async () => {
    // 1. Initial Login with temporary password -> should return token with mustChangePassword = true
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: initialTempPassword });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.mustChangePassword).toBe(true);
    const token = loginRes.body.token;
    expect(token).toBeDefined();

    // 2. Accessing normal protected route (e.g. GET /api/staff/tickets) should be blocked by checkPasswordChange (BR-02)
    const blockedRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${token}`);

    expect(blockedRes.status).toBe(403);
    expect(blockedRes.body.mustChangePassword).toBe(true);
    expect(blockedRes.body.error).toBe('Password Change Required');

    // 3. Attempting to change password to weak password (< 8 chars or missing special char) should be rejected (BR-03)
    const weakRes = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: initialTempPassword,
        newPassword: 'weak',
      });

    expect(weakRes.status).toBe(400);

    // 4. Change password to compliant strong password
    const changeRes = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: initialTempPassword,
        newPassword: newStrongPassword,
      });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body.mustChangePassword).toBe(false);

    // 5. Subsequent login with OLD password should fail (401)
    const oldLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: initialTempPassword });

    expect(oldLoginRes.status).toBe(401);

    // 6. Login with NEW password should succeed and have mustChangePassword = false
    const newLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: newStrongPassword });

    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.user.mustChangePassword).toBe(false);

    // 7. Normal protected staff queue access should now succeed (200)
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${newLoginRes.body.token}`);

    expect(queueRes.status).toBe(200);
  });
});
