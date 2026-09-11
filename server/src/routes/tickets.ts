import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateTicketNumber } from '../utils/ticketNumber';

const router = Router();
const prisma = new PrismaClient();

// Helper to extract & validate acting requester ID
function getRequesterId(req: Request): number | null {
  const headerId = req.headers['x-requester-id'];
  if (headerId && typeof headerId === 'string') {
    const parsed = parseInt(headerId, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  const queryId = req.query.requesterId;
  if (queryId && typeof queryId === 'string') {
    const parsed = parseInt(queryId, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return null;
}

// POST /api/tickets - Create a new Ticket
router.post('/', async (req: Request, res: Response) => {
  try {
    const requesterId = getRequesterId(req) || req.body.requesterId;
    if (!requesterId) {
      return res.status(400).json({
        error: 'Requester Identity Required',
        message: 'No Development Requester selected. Please select a requester identity.',
      });
    }

    // Check requester exists and is active
    const requester = await prisma.user.findFirst({
      where: { id: requesterId, isActive: true },
    });
    if (!requester) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Inactive or non-existent Development Requester identity.',
      });
    }

    const { categoryId, relatedSystemId, summary, description, requestedPriority } = req.body;
    const errors: { field: string; message: string }[] = [];

    if (!categoryId) errors.push({ field: 'categoryId', message: 'Category is required.' });
    if (!relatedSystemId) errors.push({ field: 'relatedSystemId', message: 'Related System is required.' });

    if (!summary || typeof summary !== 'string' || summary.trim().length < 5 || summary.trim().length > 150) {
      errors.push({ field: 'summary', message: 'Summary is required and must be between 5 and 150 characters.' });
    }

    if (!description || typeof description !== 'string' || description.trim().length < 10 || description.trim().length > 2000) {
      errors.push({ field: 'description', message: 'Description is required and must be between 10 and 2000 characters.' });
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    if (!requestedPriority || !validPriorities.includes(requestedPriority)) {
      errors.push({ field: 'requestedPriority', message: 'Valid Requested Priority is required (LOW, MEDIUM, HIGH, URGENT).' });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors,
      });
    }

    const ticketNumber = await generateTicketNumber();

    const newTicket = await prisma.ticket.create({
      data: {
        ticketNumber,
        requesterId,
        categoryId: parseInt(categoryId, 10),
        relatedSystemId: parseInt(relatedSystemId, 10),
        summary: summary.trim(),
        description: description.trim(),
        requestedPriority,
        itPriority: 'MEDIUM',
        currentStatus: 'NEW',
      },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true, code: true } },
        requester: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(201).json(newTicket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create ticket.' });
  }
});

// GET /api/tickets - List owned tickets (with search, filter, sort, pagination)
router.get('/', async (req: Request, res: Response) => {
  try {
    const requesterId = getRequesterId(req);
    if (!requesterId) {
      return res.status(400).json({
        error: 'Requester Identity Required',
        message: 'No Development Requester selected.',
      });
    }

    const {
      search,
      categoryId,
      priority,
      status,
      sort = 'ticketDate',
      order = 'desc',
      page = '1',
      limit = '10',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      requesterId,
    };

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { ticketNumber: { contains: q } },
        { summary: { contains: q } },
      ];
    }

    if (categoryId) {
      where.categoryId = parseInt(categoryId as string, 10);
    }

    if (priority) {
      where.requestedPriority = priority as string;
    }

    if (status) {
      where.currentStatus = status as string;
    }

    const validSortFields = ['ticketNumber', 'ticketDate', 'updatedAt', 'requestedPriority', 'currentStatus'];
    const sortField = validSortFields.includes(sort as string) ? (sort as string) : 'ticketDate';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortField]: sortOrder },
        include: {
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
          _count: {
            select: {
              attachments: {
                where: { isRemoved: false },
              },
            },
          },
        },
      }),
    ]);

    const formattedData = tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      summary: t.summary,
      description: t.description,
      category: t.category.name,
      categoryId: t.categoryId,
      relatedSystem: t.relatedSystem.name,
      relatedSystemId: t.relatedSystemId,
      requestedPriority: t.requestedPriority,
      itPriority: t.itPriority,
      currentStatus: t.currentStatus,
      ticketDate: t.ticketDate,
      updatedAt: t.updatedAt,
      attachmentCount: t._count.attachments,
    }));

    return res.status(200).json({
      data: formattedData,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch tickets.' });
  }
});

// GET /api/tickets/:id - Get owned ticket detail
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const requesterId = getRequesterId(req);
    if (!requesterId) {
      return res.status(400).json({
        error: 'Requester Identity Required',
        message: 'No Development Requester selected.',
      });
    }

    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid Ticket ID' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true, code: true } },
        requester: { select: { id: true, name: true, email: true, department: true } },
        attachments: {
          orderBy: { uploadedAt: 'asc' },
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            fileSize: true,
            isRemoved: true,
            removedAt: true,
            removedReason: true,
            uploadedAt: true,
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket Not Found', message: 'The requested ticket does not exist.' });
    }

    // Ownership Security Check
    if (ticket.requesterId !== requesterId) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have permission to view this ticket.',
      });
    }

    return res.status(200).json(ticket);
  } catch (error) {
    console.error('Error fetching ticket detail:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch ticket details.' });
  }
});

export default router;
