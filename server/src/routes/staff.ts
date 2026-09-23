import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, checkPasswordChange, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Guard all staff routes: requires authentication, normal password status, and IT_STAFF or ADMIN role
router.use(requireAuth);
router.use(checkPasswordChange);
router.use(requireRole('IT_STAFF', 'ADMIN'));

// BR-14 Permitted status transition lifecycle matrix
const PERMITTED_TRANSITIONS: Record<string, string[]> = {
  NEW: ['OPEN', 'IN_PROGRESS', 'CANCELLED'],
  OPEN: ['IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED'],
  WAITING_FOR_REQUESTER: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  REOPENED: ['IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED'],
  CANCELLED: ['REOPENED'],
};

// GET /api/staff/assignees - List eligible assignees (active IT Staff & Admins)
router.get('/assignees', async (_req: Request, res: Response) => {
  try {
    const assignees = await prisma.user.findMany({
      where: {
        role: { in: ['IT_STAFF', 'ADMIN'] },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json(assignees);
  } catch (error) {
    console.error('Error fetching assignees:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/staff/tickets - Ticket Queue query with search, filter, sort, and pagination
router.get('/tickets', async (req: Request, res: Response) => {
  try {
    const {
      search,
      categoryId,
      itPriority,
      currentStatus,
      ownership,
      sortBy = 'ticketDate',
      sortOrder = 'desc',
      page = '1',
      limit = '10',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Search by Ticket Number or Summary
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { ticketNumber: { contains: q } },
        { summary: { contains: q } },
      ];
    }

    if (categoryId) {
      const cId = parseInt(categoryId as string, 10);
      if (!isNaN(cId)) where.categoryId = cId;
    }

    if (itPriority && typeof itPriority === 'string') {
      where.itPriority = itPriority;
    }

    if (currentStatus && typeof currentStatus === 'string') {
      where.currentStatus = currentStatus;
    }

    // Ownership filter: 'all', 'unassigned', 'assignedToMe'
    if (ownership === 'unassigned') {
      where.ownerId = null;
    } else if (ownership === 'assignedToMe') {
      where.ownerId = req.user!.id;
    }

    // Allowed sort fields
    const validSortFields = ['ticketDate', 'ticketNumber', 'itPriority', 'currentStatus', 'updatedAt'];
    const orderField = validSortFields.includes(sortBy as string) ? (sortBy as string) : 'ticketDate';
    const orderDirection = (sortOrder as string).toLowerCase() === 'asc' ? 'asc' : 'desc';

    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [orderField]: orderDirection },
        include: {
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true, code: true } },
          requester: { select: { id: true, name: true, email: true, department: true } },
          owner: { select: { id: true, name: true, email: true, role: true } },
          _count: {
            select: {
              comments: true,
              notes: true,
              attachments: true,
            },
          },
        },
      }),
    ]);

    return res.status(200).json({
      data: tickets,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error('Error querying staff ticket queue:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/staff/tickets/:id - Retrieve operational ticket detail for IT Staff
router.get('/tickets/:id', async (req: Request, res: Response) => {
  try {
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
        owner: { select: { id: true, name: true, email: true, role: true } },
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
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, role: true } },
          },
        },
        notes: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, role: true } },
          },
        },
        actions: {
          orderBy: { actionDateTime: 'asc' },
          include: {
            performedBy: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Not Found', message: 'Ticket does not exist' });
    }

    return res.status(200).json(ticket);
  } catch (error) {
    console.error('Error fetching staff ticket detail:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH /api/staff/tickets/:id/claim - Claim unassigned ticket (or assign to self)
router.patch('/tickets/:id/claim', async (req: Request, res: Response) => {
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

    // Auto-advance status from NEW to OPEN on claim if applicable
    const nextStatus = ticket.currentStatus === 'NEW' ? 'OPEN' : ticket.currentStatus;

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        ownerId: req.user!.id,
        currentStatus: nextStatus,
      },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return res.status(200).json({
      message: 'Ticket successfully claimed.',
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error('Error claiming ticket:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH /api/staff/tickets/:id/assign - Assign or reassign ticket ownership
router.patch('/tickets/:id/assign', async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid Ticket ID' });
    }

    const { ownerId } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Not Found', message: 'Ticket does not exist' });
    }

    // If ownerId is provided, validate that user exists, is active, and has IT_STAFF or ADMIN role
    if (ownerId !== null && ownerId !== undefined) {
      const targetUser = await prisma.user.findUnique({
        where: { id: parseInt(ownerId, 10) },
      });

      if (!targetUser || !targetUser.isActive || !['IT_STAFF', 'ADMIN'].includes(targetUser.role)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Ticket owner must be an active IT Staff or Administrator.',
        });
      }
    }

    const nextStatus = ticket.currentStatus === 'NEW' && ownerId ? 'OPEN' : ticket.currentStatus;

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        ownerId: ownerId ? parseInt(ownerId, 10) : null,
        currentStatus: nextStatus,
      },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return res.status(200).json({
      message: 'Ticket ownership updated successfully.',
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error('Error assigning ticket:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH /api/staff/tickets/:id/priority - Update operational IT Priority
router.patch('/tickets/:id/priority', async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid Ticket ID' });
    }

    const { itPriority } = req.body;
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

    if (!itPriority || !validPriorities.includes(itPriority)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Valid IT Priority values are LOW, MEDIUM, HIGH, or URGENT.',
      });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { itPriority },
    });

    return res.status(200).json({
      message: 'IT Priority updated successfully.',
      itPriority: updatedTicket.itPriority,
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error('Error updating IT Priority:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH /api/staff/tickets/:id/status - Lifecycle Status transitions with validation
router.patch('/tickets/:id/status', async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid Ticket ID' });
    }

    const { status, resolutionSummary, expectedUpdatedAt } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Validation Error', message: 'Target status is required.' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Not Found', message: 'Ticket does not exist' });
    }

    // BR-14 / AC-15: Concurrency / Stale Update detection
    if (expectedUpdatedAt) {
      const clientTime = new Date(expectedUpdatedAt).getTime();
      const serverTime = new Date(ticket.updatedAt).getTime();
      if (Math.abs(clientTime - serverTime) > 1000) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'This ticket has been modified by another user. Please refresh and review current state.',
        });
      }
    }

    const current = ticket.currentStatus;
    const allowed = PERMITTED_TRANSITIONS[current] || [];

    // BR-14: Enforce permitted transitions
    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: 'Invalid Transition',
        message: `Status transition from ${current} to ${status} is not permitted. Allowed transitions: ${allowed.join(', ') || 'none'}`,
      });
    }

    // BR-09 / BR-10 / AC-05: RESOLUTION GATE
    // A ticket CANNOT transition to RESOLVED without at least one recorded Action Taken
    if (status === 'RESOLVED') {
      const actionCount = await prisma.actionTaken.count({
        where: { ticketId },
      });

      if (actionCount === 0) {
        return res.status(400).json({
          error: 'ResolutionGateBlocked',
          message: 'Cannot resolve ticket without at least one recorded Action Taken.',
        });
      }
    }

    const updateData: any = { currentStatus: status };
    if (resolutionSummary && typeof resolutionSummary === 'string') {
      updateData.resolutionSummary = resolutionSummary.trim();
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
    });

    return res.status(200).json({
      message: `Ticket status updated to ${status}.`,
      currentStatus: updatedTicket.currentStatus,
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
