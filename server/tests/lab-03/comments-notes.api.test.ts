import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { signToken } from '../../src/utils/auth';

describe('Lab 03 - Comments & Internal Notes API Tests', () => {
  // Tokens
  const requester1Token = signToken({
    id: 1, // Supanut (owns ticket 1 and 2)
    email: 'supanut.soph@kmutt.ac.th',
    name: 'Supanut Sopha',
    role: 'REQUESTER',
  });

  const requester2Token = signToken({
    id: 2, // Ikmie (owns ticket 3 and 8)
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

  it('API-09: should allow ticket owner to post a public comment', async () => {
    const res = await request(app)
      .post('/api/tickets/1/comments')
      .set('Authorization', `Bearer ${requester1Token}`)
      .send({
        content: 'I have attached the updated battery test diagnostics.',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.content).toBe('I have attached the updated battery test diagnostics.');
    expect(res.body.author.id).toBe(1);
    expect(res.body.author.name).toBe('Supanut Sopha');
  });

  it('API-09b: should allow ticket owner to retrieve public comments on owned ticket', async () => {
    const res = await request(app)
      .get('/api/tickets/1/comments')
      .set('Authorization', `Bearer ${requester1Token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('API-09c: should allow IT Staff to view and post public comments on any ticket', async () => {
    const postRes = await request(app)
      .post('/api/tickets/1/comments')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        content: 'Staff update: Replacement battery ordered.',
      });

    expect(postRes.status).toBe(201);
    expect(postRes.body.author.role).toBe('IT_STAFF');

    const getRes = await request(app)
      .get('/api/tickets/1/comments')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.some((c: any) => c.content === 'Staff update: Replacement battery ordered.')).toBe(true);
  });

  it('API-09d: should reject Requester from viewing or posting comments on another user ticket', async () => {
    // Requester 2 trying to access Requester 1's ticket (id 1)
    const getRes = await request(app)
      .get('/api/tickets/1/comments')
      .set('Authorization', `Bearer ${requester2Token}`);
    expect(getRes.status).toBe(403);

    const postRes = await request(app)
      .post('/api/tickets/1/comments')
      .set('Authorization', `Bearer ${requester2Token}`)
      .send({ content: 'Unauthorized comment' });
    expect(postRes.status).toBe(403);
  });

  it('API-08: should reject Requester from accessing Internal Notes with 403 without leaking note data', async () => {
    // Requester 1 attempting to view notes on owned ticket
    const getRes = await request(app)
      .get('/api/tickets/1/notes')
      .set('Authorization', `Bearer ${requester1Token}`);

    expect(getRes.status).toBe(403);
    expect(getRes.body.error).toBe('Forbidden');
    expect(getRes.body).not.toHaveProperty('notes');

    // Requester 1 attempting to post internal note
    const postRes = await request(app)
      .post('/api/tickets/1/notes')
      .set('Authorization', `Bearer ${requester1Token}`)
      .send({ content: 'Sneaky internal note' });

    expect(postRes.status).toBe(403);
  });

  it('API-10: should allow IT Staff to view and post confidential Internal Notes', async () => {
    const postRes = await request(app)
      .post('/api/tickets/1/notes')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        content: 'Internal diagnostics: OEM battery supplier contacted for RMA.',
      });

    expect(postRes.status).toBe(201);
    expect(postRes.body.content).toBe('Internal diagnostics: OEM battery supplier contacted for RMA.');

    const getRes = await request(app)
      .get('/api/tickets/1/notes')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.some((n: any) => n.content === 'Internal diagnostics: OEM battery supplier contacted for RMA.')).toBe(true);
  });

  it('should reject empty or whitespace comments/notes with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/tickets/1/comments')
      .set('Authorization', `Bearer ${requester1Token}`)
      .send({ content: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
  });

  it('API-15: should allow Requester to indicate problem appears resolved on owned ticket', async () => {
    const res = await request(app)
      .post('/api/tickets/1/resolve-indication')
      .set('Authorization', `Bearer ${requester1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.problemResolvedIndicated).toBe(true);
    expect(res.body.message).toMatch(/indicated/i);
  });
});
