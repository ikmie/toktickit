import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, checkPasswordChange, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(requireAuth);
router.use(checkPasswordChange);

// GET /api/dashboards/requester
router.get('/requester', requireRole('REQUESTER'), async (req: Request, res: Response) => {
  try {
    const requesterId = req.user!.id;

    // Metrics for authenticated requester only
    const [totalOpenTickets, inProgress, resolved, closed, recentTickets] = await Promise.all([
      prisma.ticket.count({
        where: {
          requesterId,
          currentStatus: { in: ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER'] },
        },
      }),
      prisma.ticket.count({
        where: {
          requesterId,
          currentStatus: 'IN_PROGRESS',
        },
      }),
      prisma.ticket.count({
        where: {
          requesterId,
          currentStatus: 'RESOLVED',
        },
      }),
      prisma.ticket.count({
        where: {
          requesterId,
          currentStatus: 'CLOSED',
        },
      }),
      prisma.ticket.findMany({
        where: { requesterId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true, code: true } },
          owner: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return res.status(200).json({
      metrics: {
        totalOpenTickets,
        inProgress,
        resolved,
        closed,
      },
      recentTickets,
    });
  } catch (error) {
    console.error('Error fetching requester dashboard:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/dashboards/staff
router.get('/staff', requireRole('IT_STAFF', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const staffId = req.user!.id;

    const [
      newCount,
      openCount,
      inProgressCount,
      waitingCount,
      resolvedCount,
      closedCount,
      reopenedCount,
      cancelledCount,
      myAssignedCount,
      unassignedCount,
      urgentHighCount,
      recentActionsCount,
      recentTickets,
    ] = await Promise.all([
      prisma.ticket.count({ where: { currentStatus: 'NEW' } }),
      prisma.ticket.count({ where: { currentStatus: 'OPEN' } }),
      prisma.ticket.count({ where: { currentStatus: 'IN_PROGRESS' } }),
      prisma.ticket.count({ where: { currentStatus: 'WAITING_FOR_REQUESTER' } }),
      prisma.ticket.count({ where: { currentStatus: 'RESOLVED' } }),
      prisma.ticket.count({ where: { currentStatus: 'CLOSED' } }),
      prisma.ticket.count({ where: { currentStatus: 'REOPENED' } }),
      prisma.ticket.count({ where: { currentStatus: 'CANCELLED' } }),
      prisma.ticket.count({
        where: {
          ownerId: staffId,
          currentStatus: { notIn: ['RESOLVED', 'CLOSED', 'CANCELLED'] },
        },
      }),
      prisma.ticket.count({
        where: {
          ownerId: null,
          currentStatus: { notIn: ['RESOLVED', 'CLOSED', 'CANCELLED'] },
        },
      }),
      prisma.ticket.count({
        where: {
          itPriority: { in: ['HIGH', 'URGENT'] },
          currentStatus: { notIn: ['RESOLVED', 'CLOSED', 'CANCELLED'] },
        },
      }),
      prisma.actionTaken.count(),
      prisma.ticket.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          requester: { select: { id: true, name: true, email: true } },
          owner: { select: { id: true, name: true, email: true } },
          category: { select: { id: true, name: true } },
          actions: { select: { id: true } },
        },
      }),
    ]);

    return res.status(200).json({
      metrics: {
        new: newCount,
        open: openCount,
        inProgress: inProgressCount,
        waitingForRequester: waitingCount,
        myAssigned: myAssignedCount,
        unassigned: unassignedCount,
        urgentHigh: urgentHighCount,
        recentActionsCount,
      },
      statusBreakdown: {
        NEW: newCount,
        OPEN: openCount,
        IN_PROGRESS: inProgressCount,
        WAITING_FOR_REQUESTER: waitingCount,
        RESOLVED: resolvedCount,
        CLOSED: closedCount,
        REOPENED: reopenedCount,
        CANCELLED: cancelledCount,
      },
      recentTickets: recentTickets.map((t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        summary: t.summary,
        status: t.currentStatus,
        itPriority: t.itPriority,
        requesterName: t.requester.name,
        ownerName: t.owner ? t.owner.name : 'Unassigned',
        actionsCount: t.actions.length,
        updatedAt: t.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching staff dashboard:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/dashboards/admin
router.get('/admin', requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const adminId = req.user!.id;

    const [
      newCount,
      openCount,
      inProgressCount,
      waitingCount,
      myAssignedCount,
      unassignedCount,
      urgentHighCount,
      totalUsers,
      activeUsers,
      requesterCount,
      staffCount,
      adminCount,
      recentTickets,
    ] = await Promise.all([
      prisma.ticket.count({ where: { currentStatus: 'NEW' } }),
      prisma.ticket.count({ where: { currentStatus: 'OPEN' } }),
      prisma.ticket.count({ where: { currentStatus: 'IN_PROGRESS' } }),
      prisma.ticket.count({ where: { currentStatus: 'WAITING_FOR_REQUESTER' } }),
      prisma.ticket.count({
        where: {
          ownerId: adminId,
          currentStatus: { notIn: ['RESOLVED', 'CLOSED', 'CANCELLED'] },
        },
      }),
      prisma.ticket.count({
        where: {
          ownerId: null,
          currentStatus: { notIn: ['RESOLVED', 'CLOSED', 'CANCELLED'] },
        },
      }),
      prisma.ticket.count({
        where: {
          itPriority: { in: ['HIGH', 'URGENT'] },
          currentStatus: { notIn: ['RESOLVED', 'CLOSED', 'CANCELLED'] },
        },
      }),
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'REQUESTER' } }),
      prisma.user.count({ where: { role: 'IT_STAFF' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.ticket.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          requester: { select: { id: true, name: true, email: true } },
          owner: { select: { id: true, name: true, email: true } },
          actions: { select: { id: true } },
        },
      }),
    ]);

    return res.status(200).json({
      operational: {
        new: newCount,
        open: openCount,
        inProgress: inProgressCount,
        waitingForRequester: waitingCount,
        myAssigned: myAssignedCount,
        unassigned: unassignedCount,
        urgentHigh: urgentHighCount,
      },
      userStats: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        byRole: {
          REQUESTER: requesterCount,
          IT_STAFF: staffCount,
          ADMIN: adminCount,
        },
      },
      recentTickets: recentTickets.map((t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        summary: t.summary,
        status: t.currentStatus,
        itPriority: t.itPriority,
        requesterName: t.requester.name,
        ownerName: t.owner ? t.owner.name : 'Unassigned',
        actionsCount: t.actions.length,
        updatedAt: t.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
