import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/requesters - List active Development Requesters
router.get('/', async (_req, res) => {
  try {
    const requesters = await prisma.requesterUser.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        isActive: true,
      },
    });
    return res.status(200).json(requesters);
  } catch (error) {
    console.error('Error fetching requesters:', error);
    return res.status(500).json({ error: 'Failed to fetch requesters' });
  }
});

export default router;
