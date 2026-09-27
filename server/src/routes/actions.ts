import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, checkPasswordChange } from '../middleware/auth';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();

// Enforce auth & active password status for all action operations
router.use(requireAuth);
router.use(checkPasswordChange);

/**
 * GET /api/tickets/:id/actions
 * Requesters can view actions ONLY on tickets they own.
 * IT Staff and Administrators can view actions on any ticket.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid Ticket ID' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, requesterId: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Not Found', message: 'Ticket does not exist' });
    }

    // Role check: Requesters can only access their own tickets
    if (req.user!.role === 'REQUESTER' && ticket.requesterId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied to ticket actions.' });
    }

    const actions = await prisma.actionTaken.findMany({
      where: { ticketId },
      orderBy: { actionDateTime: 'asc' },
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return res.status(200).json({ actions });
  } catch (error) {
    console.error('Error fetching actions taken:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/tickets/:id/actions
 * Only IT Staff and Administrators can record actions taken.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid Ticket ID' });
    }

    // BR-03 / AC-09: Requesters forbidden from creating actions
    if (req.user!.role === 'REQUESTER') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Requesters are not permitted to record actions taken.',
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Not Found', message: 'Ticket does not exist' });
    }

    const {
      actionDateTime,
      description,
      result,
      performedById,
      followUpRequired,
      followUpNote,
      attachmentNotes,
    } = req.body;

    // BR-06: Description and Result are mandatory
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Action description is required.',
      });
    }

    if (description.trim().length > 2000) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Action description must not exceed 2000 characters.',
      });
    }

    if (!result || typeof result !== 'string' || result.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Action result is required.',
      });
    }

    if (result.trim().length > 2000) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Action result must not exceed 2000 characters.',
      });
    }

    // BR-05 / AC-08: Follow-up note is mandatory when followUpRequired is true
    const isFollowUp = Boolean(followUpRequired);
    if (isFollowUp) {
      if (!followUpNote || typeof followUpNote !== 'string' || followUpNote.trim().length === 0) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Follow-up note is required when follow-up is requested.',
        });
      }
      if (followUpNote.trim().length > 2000) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Follow-up note must not exceed 2000 characters.',
        });
      }
    }

    // BR-04 / AC-14: PerformedBy must be an active IT Staff or Administrator
    let targetPerformerId = req.user!.id;
    if (performedById !== undefined && performedById !== null) {
      const parsedId = parseInt(performedById, 10);
      if (isNaN(parsedId)) {
        return res.status(400).json({ error: 'Validation Error', message: 'Invalid performedById' });
      }

      const performer = await prisma.user.findUnique({
        where: { id: parsedId },
      });

      if (!performer || !performer.isActive || !['IT_STAFF', 'ADMIN'].includes(performer.role)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Action performer must be an active IT Staff member or Administrator.',
        });
      }
      targetPerformerId = parsedId;
    }

    // BR-07: Action Date/Time validation
    let parsedActionDate = new Date();
    if (actionDateTime) {
      const parsed = new Date(actionDateTime);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid action date/time format.',
        });
      }
      // Cannot be > 24 hours into future
      const maxFuture = new Date(Date.now() + 24 * 60 * 60 * 1000);
      if (parsed > maxFuture) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Action date/time cannot be more than 24 hours in the future.',
        });
      }
      parsedActionDate = parsed;
    }

    const newAction = await prisma.actionTaken.create({
      data: {
        ticketId,
        actionDateTime: parsedActionDate,
        description: description.trim(),
        result: result.trim(),
        performedById: targetPerformerId,
        followUpRequired: isFollowUp,
        followUpNote: isFollowUp ? followUpNote.trim() : null,
        attachmentNotes: attachmentNotes && typeof attachmentNotes === 'string' ? attachmentNotes.trim() : null,
      },
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: 'Action taken recorded successfully',
      action: newAction,
    });
  } catch (error) {
    console.error('Error creating action taken:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * PUT /api/tickets/:id/actions/:actionId
 * Update an existing action taken record.
 */
router.put('/:actionId', async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const actionId = parseInt(req.params.actionId, 10);
    if (isNaN(ticketId) || isNaN(actionId)) {
      return res.status(400).json({ error: 'Invalid ID parameters' });
    }

    if (req.user!.role === 'REQUESTER') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Requesters are not permitted to modify actions taken.',
      });
    }

    const existingAction = await prisma.actionTaken.findFirst({
      where: { id: actionId, ticketId },
    });

    if (!existingAction) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Action Taken record not found for this ticket.',
      });
    }

    const {
      actionDateTime,
      description,
      result,
      performedById,
      followUpRequired,
      followUpNote,
      attachmentNotes,
    } = req.body;

    const updateData: any = {};

    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim().length === 0) {
        return res.status(400).json({ error: 'Validation Error', message: 'Action description cannot be empty.' });
      }
      updateData.description = description.trim();
    }

    if (result !== undefined) {
      if (typeof result !== 'string' || result.trim().length === 0) {
        return res.status(400).json({ error: 'Validation Error', message: 'Action result cannot be empty.' });
      }
      updateData.result = result.trim();
    }

    const isFollowUp = followUpRequired !== undefined ? Boolean(followUpRequired) : existingAction.followUpRequired;
    updateData.followUpRequired = isFollowUp;

    if (isFollowUp) {
      const noteToTest = followUpNote !== undefined ? followUpNote : existingAction.followUpNote;
      if (!noteToTest || typeof noteToTest !== 'string' || noteToTest.trim().length === 0) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Follow-up note is required when follow-up is requested.',
        });
      }
      updateData.followUpNote = noteToTest.trim();
    } else {
      updateData.followUpNote = null;
    }

    if (performedById !== undefined) {
      const parsedId = parseInt(performedById, 10);
      if (isNaN(parsedId)) {
        return res.status(400).json({ error: 'Validation Error', message: 'Invalid performedById' });
      }
      const performer = await prisma.user.findUnique({ where: { id: parsedId } });
      if (!performer || !performer.isActive || !['IT_STAFF', 'ADMIN'].includes(performer.role)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Action performer must be an active IT Staff member or Administrator.',
        });
      }
      updateData.performedById = parsedId;
    }

    if (actionDateTime !== undefined) {
      const parsed = new Date(actionDateTime);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ error: 'Validation Error', message: 'Invalid action date/time format.' });
      }
      updateData.actionDateTime = parsed;
    }

    if (attachmentNotes !== undefined) {
      updateData.attachmentNotes = attachmentNotes ? attachmentNotes.trim() : null;
    }

    const updatedAction = await prisma.actionTaken.update({
      where: { id: actionId },
      data: updateData,
      include: {
        performedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return res.status(200).json({
      message: 'Action taken updated successfully',
      action: updatedAction,
    });
  } catch (error) {
    console.error('Error updating action taken:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
