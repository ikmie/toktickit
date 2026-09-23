import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import { signToken } from '../../src/utils/auth';

const prisma = new PrismaClient();

describe('Lab 04 - Actions Taken API Tests', () => {
  const requesterToken = signToken({
    id: 1, // Supanut (Requester)
    email: 'supanut.soph@kmutt.ac.th',
    name: 'Supanut Sopha',
    role: 'REQUESTER',
  });

  const otherRequesterToken = signToken({
    id: 2, // Ikmie (Requester)
    email: 'ikumii.team@kmutt.ac.th',
    name: 'Ikmie ikumii',
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

  it('API-01: should allow IT Staff to create a valid Action Taken', async () => {
    // Ticket 1 belongs to user 1
    const res = await request(app)
      .post('/api/tickets/1/actions')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        actionDateTime: new Date().toISOString(),
        description: 'Replaced thermal paste on heatsink',
        result: 'Temperatures nominal at 45C under load',
        followUpRequired: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.action).toBeDefined();
    expect(res.body.action.description).toBe('Replaced thermal paste on heatsink');
    expect(res.body.action.result).toBe('Temperatures nominal at 45C under load');
    expect(res.body.action.performedBy.id).toBe(7);
    expect(res.body.action.followUpRequired).toBe(false);
  });

  it('API-02: should reject Action Taken creation when followUpRequired is true but followUpNote is missing', async () => {
    const res = await request(app)
      .post('/api/tickets/1/actions')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        description: 'Ordered new battery module',
        result: 'Pending delivery from manufacturer',
        followUpRequired: true,
        // followUpNote is missing
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/follow-up note is required/i);
  });

  it('API-03: should reject Requester from creating an Action Taken (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/tickets/1/actions')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        description: 'Requester tried to log an action',
        result: 'Unauthorized attempt',
      });

    expect(res.status).toBe(403);
  });

  it('API-04: should allow Requester to view Actions Taken on their OWN ticket', async () => {
    // Ticket 1 is owned by user 1 (requesterToken)
    const res = await request(app)
      .get('/api/tickets/1/actions')
      .set('Authorization', `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.actions)).toBe(true);
    expect(res.body.actions.length).toBeGreaterThanOrEqual(1);
    expect(res.body.actions[0]).toHaveProperty('description');
    expect(res.body.actions[0]).toHaveProperty('result');
    expect(res.body.actions[0]).toHaveProperty('performedBy');
  });

  it('API-05: should reject Requester from viewing Actions Taken on ANOTHER user ticket (403 Forbidden)', async () => {
    // Ticket 1 is owned by user 1, user 2 is attempting to access
    const res = await request(app)
      .get('/api/tickets/1/actions')
      .set('Authorization', `Bearer ${otherRequesterToken}`);

    expect(res.status).toBe(403);
  });

  it('API-06: should allow IT Staff to update an existing Action Taken', async () => {
    // Action 1 was seeded for ticket 1
    const res = await request(app)
      .put('/api/tickets/1/actions/1')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        description: 'Conducted hardware diagnostic test and verified battery health.',
        result: 'Battery health test complete; wear level normal.',
        followUpRequired: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.action.id).toBe(1);
    expect(res.body.action.description).toBe('Conducted hardware diagnostic test and verified battery health.');
  });

  it('API-07: should reject Action Taken assignment if performedById is an inactive user or not staff/admin', async () => {
    // User 11 is inactive staff
    const res = await request(app)
      .post('/api/tickets/1/actions')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        description: 'Assigned to inactive technician',
        result: 'Should fail',
        performedById: 11,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/must be an active IT Staff/i);
  });

  it('API-07b: should allow an action to be performed by a different staff member than ticket owner (BR-02)', async () => {
    // Ticket 1 owner is user 7 (Michael Brown). Action performed by user 8 (Sarah Johnson)
    const res = await request(app)
      .post('/api/tickets/1/actions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        description: 'Second opinion diagnostic performed by Sarah',
        result: 'Agreed with battery replacement',
        performedById: 8,
        followUpRequired: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.action.performedBy.id).toBe(8);
  });
});
