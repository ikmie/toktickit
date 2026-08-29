import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/related-systems - List active Related Systems
router.get('/', async (_req, res) => {
  try {
    const systems = await prisma.relatedSystem.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
      },
    });
    return res.status(200).json(systems);
  } catch (error) {
    console.error('Error fetching related systems:', error);
    return res.status(500).json({ error: 'Failed to fetch related systems' });
  }
});

export default router;
