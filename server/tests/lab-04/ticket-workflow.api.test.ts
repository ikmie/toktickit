import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import { signToken } from '../../src/utils/auth';

const prisma = new PrismaClient();

describe('Lab 04 - Ticket Workflow & Resolution Gate API Tests', () => {
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

  it('API-08: should reject resolving a ticket if it has 0 Actions Taken (Resolution Gate)', async () => {
    // Create a new ticket that will have 0 actions
    const newTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-GATE-TEST-${Date.now()}`,
        requesterId: 1,
        categoryId: 1,
        relatedSystemId: 1,
        summary: 'Test resolution gate with 0 actions',
        description: 'Trying to resolve without actions',
        requestedPriority: 'MEDIUM',
        currentStatus: 'IN_PROGRESS',
        ownerId: 7,
      },
    });

    const res = await request(app)
      .patch(`/api/staff/tickets/${newTicket.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'RESOLVED', resolutionSummary: 'Attempted resolution' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ResolutionGateBlocked');
    expect(res.body.message).toMatch(/at least one recorded Action Taken/i);
  });

  it('API-09: should allow resolving a ticket when it has at least one Action Taken', async () => {
    // Create a new ticket
    const newTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-GATE-PASS-${Date.now()}`,
        requesterId: 1,
        categoryId: 1,
        relatedSystemId: 1,
        summary: 'Test resolution gate with 1 action',
        description: 'Should resolve properly',
        requestedPriority: 'MEDIUM',
        currentStatus: 'IN_PROGRESS',
        ownerId: 7,
      },
    });

    // Add an action taken
    await prisma.actionTaken.create({
      data: {
        ticketId: newTicket.id,
        description: 'Configured mail client correctly',
        result: 'Successfully verified sending and receiving',
        performedById: 7,
      },
    });

    const res = await request(app)
      .patch(`/api/staff/tickets/${newTicket.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        status: 'RESOLVED',
        resolutionSummary: 'Verified and resolved with client.',
      });

    expect(res.status).toBe(200);
    expect(res.body.currentStatus).toBe('RESOLVED');
  });

  it('API-10: should verify Requester problem resolution indication is purely advisory', async () => {
    // Create a new ticket
    const newTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-ADVISORY-${Date.now()}`,
        requesterId: 1,
        categoryId: 1,
        relatedSystemId: 1,
        summary: 'Test advisory resolution indication',
        description: 'Requester indicates resolved',
        requestedPriority: 'LOW',
        currentStatus: 'IN_PROGRESS',
        ownerId: 7,
      },
    });

    const res = await request(app)
      .post(`/api/tickets/${newTicket.id}/resolve-indication`)
      .set('Authorization', `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    expect(res.body.ticket.problemResolvedIndicated).toBe(true);
    // Crucial check: status must NOT be changed to RESOLVED automatically
    expect(res.body.ticket.currentStatus).toBe('IN_PROGRESS');
  });

  it('API-11: should reject invalid status transition (e.g. NEW to RESOLVED)', async () => {
    const newTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-INVALID-TRANS-${Date.now()}`,
        requesterId: 1,
        categoryId: 1,
        relatedSystemId: 1,
        summary: 'Test invalid transition',
        description: 'From NEW directly to RESOLVED',
        requestedPriority: 'LOW',
        currentStatus: 'NEW',
      },
    });

    const res = await request(app)
      .patch(`/api/staff/tickets/${newTicket.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'RESOLVED' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid Transition');
  });

  it('API-12: should detect and reject stale updates (concurrency conflict)', async () => {
    const newTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-STALE-${Date.now()}`,
        requesterId: 1,
        categoryId: 1,
        relatedSystemId: 1,
        summary: 'Test stale update',
        description: 'Conflict detection',
        requestedPriority: 'LOW',
        currentStatus: 'OPEN',
        ownerId: 7,
      },
    });

    // Send an outdated timestamp
    const pastTimestamp = new Date(Date.now() - 100000).toISOString();

    const res = await request(app)
      .patch(`/api/staff/tickets/${newTicket.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        status: 'IN_PROGRESS',
        expectedUpdatedAt: pastTimestamp,
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Conflict');
    expect(res.body.message).toMatch(/modified by another user/i);
  });
});
