import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Lab 03 - Authentication API Tests', () => {
  beforeAll(async () => {
    const initialHash = await bcrypt.hash('Initial123!', 10);
    await prisma.user.update({
      where: { id: 10 },
      data: {
        passwordHash: initialHash,
        mustChangePassword: true,
      },
    });
  });
  it('API-01: should authenticate an active user with valid credentials and return token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'supanut.soph@kmutt.ac.th',
        password: 'Password123!',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe('supanut.soph@kmutt.ac.th');
    expect(response.body.user.role).toBe('REQUESTER');
    expect(response.body.user.isActive).toBe(true);
    expect(response.body.user.mustChangePassword).toBe(false);
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  it('API-02: should reject authentication for inactive user account with 403 Forbidden', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'mwl@kmutt.ac.th', // Inactive requester seeded in DB
        password: 'Password123!',
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
    expect(response.body.message).toMatch(/inactive/i);
  });

  it('API-03: should reject login with invalid password with 401 Unauthorized', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'supanut.soph@kmutt.ac.th',
        password: 'WrongPassword999!',
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized');
  });

  it('API-03b: should reject login with non-existent email with 401 Unauthorized', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent.user@kmutt.ac.th',
        password: 'Password123!',
      });

    expect(response.status).toBe(401);
  });

  it('API-03c: should return 400 when email or password is missing', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'supanut.soph@kmutt.ac.th',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation Error');
  });

  it('API-04: should return mustChangePassword: true for user with initial temporary password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alex.t@toktickit.com',
        password: 'Initial123!',
      });

    expect(response.status).toBe(200);
    expect(response.body.user.mustChangePassword).toBe(true);
    expect(response.body.token).toBeDefined();
  });

  it('API-05: should reject password change if current password does not match', async () => {
    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alex.t@toktickit.com',
        password: 'Initial123!',
      });
    const token = loginRes.body.token;

    const changeRes = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'WrongCurrentPassword123!',
        newPassword: 'BrandNewPassword2026#',
      });

    expect(changeRes.status).toBe(401);
  });

  it('API-05b: should reject password change if new password does not meet complexity rules', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alex.t@toktickit.com',
        password: 'Initial123!',
      });
    const token = loginRes.body.token;

    // Too short / missing special chars
    const changeRes = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'Initial123!',
        newPassword: 'weak',
      });

    expect(changeRes.status).toBe(400);
    expect(changeRes.body.error).toBe('Weak Password');
  });

  it('API-05c: should successfully change password with valid input and clear mustChangePassword', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alex.t@toktickit.com',
        password: 'Initial123!',
      });
    const token = loginRes.body.token;

    const changeRes = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'Initial123!',
        newPassword: 'BrandNewSecurePassword88#',
      });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body.mustChangePassword).toBe(false);

    // Verify user can log in with new password
    const newLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alex.t@toktickit.com',
        password: 'BrandNewSecurePassword88#',
      });

    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.user.mustChangePassword).toBe(false);

    // Revert password and mustChangePassword flag back for test repeatability
    await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${newLoginRes.body.token}`)
      .send({
        currentPassword: 'BrandNewSecurePassword88#',
        newPassword: 'Initial123!',
      });

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.user.update({
      where: { id: 10 },
      data: { mustChangePassword: true },
    });
    await prisma.$disconnect();
  });

  it('API-06: should successfully logout authenticated user', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'supanut.soph@kmutt.ac.th',
        password: 'Password123!',
      });

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toMatch(/logged out/i);
  });

  it('should retrieve authenticated user profile on /api/auth/me', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@toktickit.com',
        password: 'Password123!',
      });

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe('admin@toktickit.com');
    expect(meRes.body.user.role).toBe('ADMIN');
  });

  it('should reject unauthenticated request to /api/auth/me with 401', async () => {
    const response = await request(app).get('/api/auth/me');
    expect(response.status).toBe(401);
  });
});
