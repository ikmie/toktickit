import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateTicketNumber } from '../utils/ticketNumber';
import { optionalAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(optionalAuth);

// Helper to extract & validate acting requester ID
// BR-04 / AC-03: req.user.id always overrides client-supplied IDs
function getRequesterId(req: Request): number | null {
  if (req.user && req.user.id) {
    return req.user.id;
  }
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

// POST /api/tickets/:id/resolve-indication - Requester indicates problem appears resolved
router.post('/:id/resolve-indication', async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid Ticket ID' });
    }

    const requesterId = getRequesterId(req);
    if (!requesterId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Not Found', message: 'Ticket does not exist' });
    }

    if (ticket.requesterId !== requesterId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Only ticket owner can indicate problem resolution' });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        problemResolvedIndicated: true,
      },
    });

    return res.status(200).json({
      message: 'Problem resolution indicated. IT Staff has been notified.',
      problemResolvedIndicated: true,
      ticket: updated,
    });
  } catch (error) {
    console.error('Error indicating problem resolved:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/tickets/:id/comments - Retrieve public comments
router.get('/:id/comments', async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid Ticket ID' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Not Found', message: 'Ticket does not exist' });
    }

    const actingUserId = getRequesterId(req);
    const role = req.user?.role;

    // BR-04 / BR-06: Requester can only view comments on owned tickets
    if (role === 'REQUESTER' || (!role && actingUserId)) {
      if (ticket.requesterId !== actingUserId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
      }
    } else if (!role && !actingUserId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    const comments = await prisma.comment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/tickets/:id/comments - Post a public comment
router.post('/:id/comments', async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid Ticket ID' });
    }

    const actingUserId = getRequesterId(req);
    if (!actingUserId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Not Found', message: 'Ticket does not exist' });
    }

    const role = req.user?.role;
    // Requester check: must own ticket
    if (role === 'REQUESTER' || (!role && actingUserId)) {
      if (ticket.requesterId !== actingUserId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
      }
    }

    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Comment content cannot be empty.',
      });
    }

    if (content.trim().length > 2000) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Comment cannot exceed 2000 characters.',
      });
    }

    const newComment = await prisma.comment.create({
      data: {
        ticketId,
        authorId: actingUserId,
        content: content.trim(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json(newComment);
  } catch (error) {
    console.error('Error posting comment:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/tickets/:id/notes - Restricted to IT Staff and Admin (BR-07, AC-04)
router.get('/:id/notes', async (req: Request, res: Response) => {
  try {
    const role = req.user?.role;
    if (role !== 'IT_STAFF' && role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Internal Notes are restricted to IT Staff and Administrators.',
      });
    }

    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid Ticket ID' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) {
      return res.status(404).json({ error: 'Not Found', message: 'Ticket does not exist' });
    }

    const notes = await prisma.internalNote.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json(notes);
  } catch (error) {
    console.error('Error fetching internal notes:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/tickets/:id/notes - Restricted to IT Staff and Admin (BR-07, AC-04)
router.post('/:id/notes', async (req: Request, res: Response) => {
  try {
    const role = req.user?.role;
    if (role !== 'IT_STAFF' && role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Internal Notes are restricted to IT Staff and Administrators.',
      });
    }

    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid Ticket ID' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) {
      return res.status(404).json({ error: 'Not Found', message: 'Ticket does not exist' });
    }

    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Internal note content cannot be empty.',
      });
    }

    if (content.trim().length > 2000) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Internal note cannot exceed 2000 characters.',
      });
    }

    const note = await prisma.internalNote.create({
      data: {
        ticketId,
        authorId: req.user!.id,
        content: content.trim(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json(note);
  } catch (error) {
    console.error('Error posting internal note:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
