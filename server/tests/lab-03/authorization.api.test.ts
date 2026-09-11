import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import { requireAuth, requireRole, checkPasswordChange } from '../../src/middleware/auth';
import { signToken } from '../../src/utils/auth';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Lab 03 - Server-Side Authorization Middleware Tests', () => {
  let testApp: express.Application;

  beforeAll(async () => {
    await prisma.user.update({
      where: { id: 10 },
      data: { mustChangePassword: true },
    });
    testApp = express();
    testApp.use(express.json());

    // Protected endpoint requiring authentication and normal password status
    testApp.get('/api/protected/general', requireAuth, checkPasswordChange, (req: Request, res: Response) => {
      res.status(200).json({ status: 'ok', user: req.user });
    });

    // Protected endpoint requiring IT_STAFF role
    testApp.get('/api/protected/staff-only', requireAuth, checkPasswordChange, requireRole('IT_STAFF', 'ADMIN'), (_req, res) => {
      res.status(200).json({ status: 'ok', role: 'Staff or Admin permitted' });
    });

    // Protected endpoint requiring ADMIN role
    testApp.get('/api/protected/admin-only', requireAuth, checkPasswordChange, requireRole('ADMIN'), (_req, res) => {
      res.status(200).json({ status: 'ok', role: 'Admin permitted' });
    });
  });

  it('should reject request missing Authorization header with 401 Unauthorized', async () => {
    const res = await request(testApp).get('/api/protected/general');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('should reject malformed or invalid Bearer token with 401 Unauthorized', async () => {
    const res = await request(testApp)
      .get('/api/protected/general')
      .set('Authorization', 'Bearer invalid.tampered.token');

    expect(res.status).toBe(401);
  });

  it('should reject token of inactive user with 403 Forbidden', async () => {
    // User id 6 is seeded as inactive
    const token = signToken({
      id: 6,
      email: 'mwl@kmutt.ac.th',
      name: 'Mai wai laeww',
      role: 'REQUESTER',
    });

    const res = await request(testApp)
      .get('/api/protected/general')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('BR-02: should block normal application access when user mustChangePassword is true', async () => {
    // User id 10 has mustChangePassword: true in seed
    const token = signToken({
      id: 10,
      email: 'alex.t@toktickit.com',
      name: 'Alex Thompson',
      role: 'IT_STAFF',
      mustChangePassword: true,
    });

    const res = await request(testApp)
      .get('/api/protected/general')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Password Change Required');
    expect(res.body.mustChangePassword).toBe(true);
  });

  it('should allow active user with valid credentials and clean password state', async () => {
    const token = signToken({
      id: 1,
      email: 'supanut.soph@kmutt.ac.th',
      name: 'Supanut Sopha',
      role: 'REQUESTER',
      mustChangePassword: false,
    });

    const res = await request(testApp)
      .get('/api/protected/general')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('supanut.soph@kmutt.ac.th');
  });

  it('should allow IT Staff access to staff-only endpoints and reject Requester with 403', async () => {
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

    // Requester forbidden
    const reqRes = await request(testApp)
      .get('/api/protected/staff-only')
      .set('Authorization', `Bearer ${requesterToken}`);
    expect(reqRes.status).toBe(403);
    expect(reqRes.body.error).toBe('Forbidden');

    // Staff allowed
    const staffRes = await request(testApp)
      .get('/api/protected/staff-only')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(staffRes.status).toBe(200);
  });

  it('should allow Admin access to admin-only endpoint and reject IT Staff with 403', async () => {
    const staffToken = signToken({
      id: 7,
      email: 'michael.b@toktickit.com',
      name: 'Michael Brown',
      role: 'IT_STAFF',
    });

    const adminToken = signToken({
      id: 12,
      email: 'admin@toktickit.com',
      name: 'Admin User',
      role: 'ADMIN',
    });

    // Staff forbidden
    const staffRes = await request(testApp)
      .get('/api/protected/admin-only')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(staffRes.status).toBe(403);

    // Admin allowed
    const adminRes = await request(testApp)
      .get('/api/protected/admin-only')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminRes.status).toBe(200);
  });
});
