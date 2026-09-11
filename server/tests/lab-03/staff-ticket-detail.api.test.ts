import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import { signToken } from '../../src/utils/auth';

const prisma = new PrismaClient();

describe('Lab 03 - IT Staff Ticket Detail & Actions API Tests', () => {
  beforeEach(async () => {
    // Reset test tickets to pristine state
    await prisma.ticket.update({
      where: { id: 4 },
      data: { currentStatus: 'OPEN', ownerId: 7 },
    });
    await prisma.ticket.update({
      where: { id: 7 },
      data: { currentStatus: 'NEW', ownerId: null },
    });
  });

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

  it('TC-STF-09: should retrieve detailed operational ticket for IT Staff', async () => {
    const res = await request(app)
      .get('/api/staff/tickets/1')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
    expect(res.body).toHaveProperty('requester');
    expect(res.body).toHaveProperty('owner');
    expect(res.body).toHaveProperty('comments');
    expect(res.body).toHaveProperty('notes');
    expect(res.body).toHaveProperty('attachments');
  });

  it('TC-STF-10: should allow staff to claim an unassigned ticket and auto-transition NEW to OPEN', async () => {
    // Ticket 7 is unassigned with status NEW
    const res = await request(app)
      .patch('/api/staff/tickets/7/claim')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.ticket.ownerId).toBe(7);
    expect(res.body.ticket.currentStatus).toBe('OPEN');
  });

  it('TC-STF-11: should allow staff to reassign ticket to another eligible IT staff member', async () => {
    const res = await request(app)
      .patch('/api/staff/tickets/7/assign')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ ownerId: 8 }); // Sarah Johnson

    expect(res.status).toBe(200);
    expect(res.body.ticket.ownerId).toBe(8);
    expect(res.body.ticket.owner.name).toBe('Sarah Johnson');
  });

  it('TC-STF-12: should reject ticket assignment if target user is not active IT Staff or Admin', async () => {
    // User 1 is a REQUESTER
    const res = await request(app)
      .patch('/api/staff/tickets/7/assign')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ ownerId: 1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/must be an active IT Staff or Administrator/i);
  });

  it('TC-STF-13: should allow staff to update IT Priority', async () => {
    const res = await request(app)
      .patch('/api/staff/tickets/1/priority')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ itPriority: 'URGENT' });

    expect(res.status).toBe(200);
    expect(res.body.itPriority).toBe('URGENT');
  });

  it('TC-STF-14: should reject invalid IT Priority values', async () => {
    const res = await request(app)
      .patch('/api/staff/tickets/1/priority')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ itPriority: 'CRITICAL' }); // Invalid enum

    expect(res.status).toBe(400);
  });

  it('TC-STF-15: should allow valid status transition (BR-14)', async () => {
    // Ticket 4 is currently OPEN. Allowed from OPEN: IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, CANCELLED
    const res = await request(app)
      .patch('/api/staff/tickets/4/status')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(200);
    expect(res.body.currentStatus).toBe('IN_PROGRESS');
  });

  it('TC-STF-16: should reject forbidden status transition with 400 Invalid Transition (BR-14)', async () => {
    // Ticket 4 is now IN_PROGRESS. Allowed from IN_PROGRESS: WAITING_FOR_REQUESTER, RESOLVED, CANCELLED.
    // Transition to CLOSED or NEW is invalid.
    const res = await request(app)
      .patch('/api/staff/tickets/4/status')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'CLOSED' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid Transition');
    expect(res.body.message).toMatch(/not permitted/i);
  });
});
